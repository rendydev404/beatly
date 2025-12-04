import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
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

    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('daily_usage')
        .eq('user_id', user.id)
        .single()

    if (subscription) {
        await supabase
            .from('user_subscriptions')
            .update({ daily_usage: subscription.daily_usage + 1 })
            .eq('user_id', user.id)
    } else {
        // If missing, create it with usage = 1
        await supabase
            .from('user_subscriptions')
            .insert({
                user_id: user.id,
                plan_id: 'free',
                daily_usage: 1,
                last_reset_date: new Date().toISOString().split('T')[0]
            })
    }

    return NextResponse.json({ success: true })
}
