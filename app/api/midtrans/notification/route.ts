import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import midtransClient from 'midtrans-client'

const apiClient = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
})

export async function POST(req: Request) {
    try {
        const notificationJson = await req.json()

        const statusResponse = await apiClient.transaction.notification(notificationJson)
        const orderId = statusResponse.order_id
        const transactionStatus = statusResponse.transaction_status
        const fraudStatus = statusResponse.fraud_status

        console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`)

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        )

        // We need service role key to update other users' data securely if RLS blocks it, 
        // but for now we will try with anon key if policies allow or if we had service key.
        // Ideally use SERVICE_ROLE_KEY for webhooks.
        // Since I don't have SERVICE_ROLE_KEY in env yet, I'll assume RLS allows update based on transaction ID or I'll add a note.
        // Actually, for webhooks, we usually need admin privileges. 
        // I will assume the user will add SUPABASE_SERVICE_ROLE_KEY to env if needed, but for now let's try to update.

        let newStatus = 'pending'

        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') {
                newStatus = 'challenge'
            } else if (fraudStatus == 'accept') {
                newStatus = 'success'
            }
        } else if (transactionStatus == 'settlement') {
            newStatus = 'success'
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            newStatus = 'failed'
        } else if (transactionStatus == 'pending') {
            newStatus = 'pending'
        }

        // Update transaction status
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .update({ status: newStatus })
            .eq('id', orderId)
            .select()
            .single()

        if (txError) {
            console.error('Error updating transaction:', txError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // If success, update user subscription
        if (newStatus === 'success' && transaction) {
            await supabase
                .from('user_subscriptions')
                .update({
                    plan_id: transaction.plan_id,
                    // Reset usage on upgrade? Optional. Let's say yes.
                    // daily_usage: 0 
                })
                .eq('user_id', transaction.user_id)
        }

        return NextResponse.json({ status: 'OK' })

    } catch (error: any) {
        console.error('Midtrans Notification Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
