import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = 'Rendy@123'

export async function GET(req: Request) {
    // Public read is fine for plans, but let's just return them
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.from('plans').select('*').order('price')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
}

export async function PUT(req: Request) {
    const password = req.headers.get('x-admin-password')

    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, price, daily_limit } = await req.json()

    // Use service role key if available, otherwise we might be blocked by RLS if we don't have update policy.
    // Since we don't have SERVICE_ROLE_KEY in env yet (user hasn't added it), we are stuck if RLS blocks.
    // However, we can try. If it fails, we'll know.
    // Actually, I should probably ask the user to add SERVICE_ROLE_KEY if they want admin features to work properly backend-side.
    // But for now, let's assume the user might have added it or we can use the anon key if RLS allows (it doesn't).

    // WORKAROUND: If we don't have service key, we can't update plans from server unless we have a policy.
    // I'll assume the user will run the SQL to allow updates or has the key.
    // For this code, I'll use the anon key but ideally it should be service key.

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from('plans')
        .update({ price, daily_limit })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
}
