'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

declare global {
    interface Window {
        snap: any
    }
}

const PLANS = [
    { id: 'free', name: 'Free', price: 0, limit: 25, features: ['25 Songs/Day', 'Ads Support'] },
    { id: 'plus', name: 'Plus', price: 25000, limit: 50, features: ['50 Songs/Day', 'No Ads', 'High Quality'] },
    { id: 'pro', name: 'Pro', price: 50000, limit: 100, features: ['100 Songs/Day', 'No Ads', 'Ultra Quality', 'Offline Mode'] },
]

export default function PricingPage() {
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        // Load Midtrans Snap Script
        const script = document.createElement('script')
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
        document.body.appendChild(script)

        // Check Auth
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const handleUpgrade = async (plan: typeof PLANS[0]) => {
        if (!user) {
            router.push('/login')
            return
        }

        if (plan.price === 0) return // Cannot upgrade to free

        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            const res = await fetch('/api/midtrans/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    planId: plan.id,
                    price: plan.price
                })
            })

            const data = await res.json()

            if (data.error) throw new Error(data.error)

            window.snap.pay(data.token, {
                onSuccess: function (result: any) {
                    alert('Payment success!')
                    router.refresh()
                },
                onPending: function (result: any) {
                    alert('Waiting for payment...')
                },
                onError: function (result: any) {
                    alert('Payment failed!')
                },
                onClose: function () {
                    alert('You closed the popup without finishing the payment')
                }
            })

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
            <p className="text-center text-gray-400 mb-12">Unlock more music with Beatly Premium</p>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {PLANS.map((plan) => (
                    <div key={plan.id} className={`p-8 rounded-2xl border ${plan.id === 'pro' ? 'border-green-500 bg-green-900/20' : 'border-gray-800 bg-gray-900/50'}`}>
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-3xl font-bold mb-6">
                            {plan.price === 0 ? 'Free' : `Rp ${plan.price.toLocaleString()}`}
                            <span className="text-sm text-gray-400 font-normal">/month</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center text-gray-300">
                                    <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade(plan)}
                            disabled={loading || plan.price === 0}
                            className={`w-full py-3 rounded-full font-bold transition-all ${plan.price === 0
                                    ? 'bg-gray-700 cursor-not-allowed'
                                    : 'bg-green-500 hover:bg-green-400 text-black'
                                }`}
                        >
                            {plan.price === 0 ? 'Current Plan' : 'Upgrade Now'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
