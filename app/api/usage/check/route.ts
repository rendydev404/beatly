import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use RPC to ensure subscription exists (bypassing RLS issues)
    let { data: subscription, error: subError } = await supabase
        .rpc('ensure_user_subscription', { target_user_id: user.id })

    if (subError || !subscription) {
        console.error('Error ensuring subscription:', subError)
        return NextResponse.json({ allowed: false, message: 'Subscription error' })
    }

    // Fetch plan details manually since RPC returns just the subscription
    const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('daily_limit')
        .eq('id', subscription.plan_id)
        .single()

    if (planError || !planData) {
        return NextResponse.json({ allowed: false, message: 'Plan error' })
    }

    // Merge plan data into subscription object for compatibility
    subscription.plans = planData

    const today = new Date().toISOString().split('T')[0]
    const lastReset = subscription.last_reset_date
    const limit = subscription.plans.daily_limit

    if (lastReset !== today) {
        await supabase
            .from('user_subscriptions')
            .update({ daily_usage: 0, last_reset_date: today })
            .eq('user_id', user.id)

        return NextResponse.json({ allowed: true, remaining: limit })
    }

    if (subscription.daily_usage >= limit) {
        return NextResponse.json({
            allowed: false,
            message: `Daily limit of ${limit} songs reached. Upgrade to listen more!`
        })
    }

    return NextResponse.json({ allowed: true, remaining: limit - subscription.daily_usage })
}
