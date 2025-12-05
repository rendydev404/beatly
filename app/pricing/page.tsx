'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Crown, Zap, Star, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'



interface DbPlan {
    id: string;
    name: string;
    price: number;
    daily_limit: number;
    features: string[];
    duration_type: 'day' | 'week' | 'month' | 'year';
    duration_value: number;
    is_popular: boolean;
}

interface Plan extends DbPlan {
    icon: typeof Crown;
}

const iconMap: Record<string, typeof Crown> = {
    free: Star,
    plus: Zap,
    pro: Crown
}

const getDurationText = (type: string, value: number) => {
    const labels: Record<string, string> = {
        day: 'hari',
        week: 'minggu',
        month: 'bulan',
        year: 'tahun'
    }
    return `/${value > 1 ? `${value} ` : ''}${labels[type] || 'bulan'}`
}

function PricingContent() {
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
    const [currentPlan, setCurrentPlan] = useState<string>('free')
    const [verifying, setVerifying] = useState(false)
    const [plans, setPlans] = useState<Plan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Fetch plans from database
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/admin/plans')
                if (res.ok) {
                    const data: DbPlan[] = await res.json()
                    const plansWithIcons: Plan[] = data.map(plan => ({
                        ...plan,
                        features: plan.features || [],
                        duration_type: plan.duration_type || 'month',
                        duration_value: plan.duration_value || 1,
                        is_popular: plan.is_popular || false,
                        icon: iconMap[plan.id] || Star
                    }))
                    setPlans(plansWithIcons)
                }
            } catch (error) {
                console.error('Error fetching plans:', error)
            } finally {
                setLoadingPlans(false)
            }
        }
        fetchPlans()
    }, [])

    const verifyTransactionByOrderId = useCallback(async (orderId: string) => {
        console.log('Verifying transaction by order_id:', orderId)
        setVerifying(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                console.error('No session found')
                setVerifying(false)
                return false
            }

            const res = await fetch('/api/midtrans/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ transactionId: orderId })
            })

            const data = await res.json()
            console.log('Verify response:', data)

            if (data.status === 'success') {
                setCurrentPlan(data.plan || 'plus')
                router.replace('/pricing')
                return true
            } else {
                console.error('Verify failed:', data)
                return false
            }
        } catch (error) {
            console.error('Error verifying transaction:', error)
            return false
        } finally {
            setVerifying(false)
        }
    }, [router])

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    try {
                        const res = await fetch('/api/subscription/current', {
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`
                            }
                        })
                        if (res.ok) {
                            const data = await res.json()
                            setCurrentPlan(data.plan_id || 'free')
                        }
                    } catch {
                        // Ignore
                    }
                }
            }
        }
        checkUser()

        const orderId = searchParams.get('order_id')
        const transactionStatus = searchParams.get('transaction_status')
        const statusCode = searchParams.get('status_code')

        if (orderId && (transactionStatus === 'settlement' || transactionStatus === 'capture' || statusCode === '200')) {
            verifyTransactionByOrderId(orderId)
        }
    }, [searchParams, verifyTransactionByOrderId])

    const handleUpgrade = (plan: Plan) => {
        if (!user) {
            router.push('/login')
            return
        }

        if (plan.price === 0 || plan.id === currentPlan) return

        // Redirect to checkout page with plan data
        const params = new URLSearchParams({
            plan: plan.id,
            name: plan.name,
            price: plan.price.toString()
        })

        router.push(`/checkout?${params.toString()}`)
    }

    if (loadingPlans) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 text-white pt-20 pb-16 px-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 text-white pt-20 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                {verifying && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                        <div className="bg-zinc-800 p-8 rounded-2xl flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <p className="text-lg font-medium">Memverifikasi pembayaran...</p>
                        </div>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Unlock more music with Beatly Premium
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon
                        const isCurrentPlan = currentPlan === plan.id

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative p-8 rounded-2xl border backdrop-blur-sm ${plan.is_popular
                                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                    : isCurrentPlan
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-gray-800 bg-zinc-900/50'
                                    }`}
                            >
                                {plan.is_popular && !isCurrentPlan && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                                            POPULER
                                        </span>
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            PAKET ANDA
                                        </span>
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${plan.is_popular ? 'bg-primary/20' : 'bg-zinc-800'}`}>
                                    <Icon className={`w-6 h-6 ${plan.is_popular ? 'text-primary' : 'text-gray-400'}`} />
                                </div>

                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold">
                                        {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                                    </span>
                                    {plan.price > 0 && (
                                        <span className="text-gray-400 text-sm">
                                            {getDurationText(plan.duration_type, plan.duration_value)}
                                        </span>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-gray-300">
                                            <Check className={`w-5 h-5 mr-3 ${plan.is_popular ? 'text-primary' : 'text-green-500'}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={plan.price === 0 || isCurrentPlan || verifying}
                                    className={`w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${isCurrentPlan
                                        ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                                        : plan.price === 0
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : plan.is_popular
                                                ? 'bg-primary hover:bg-primary/90 text-white'
                                                : 'bg-white hover:bg-gray-200 text-black'
                                        }`}
                                >
                                    {isCurrentPlan ? (
                                        'Current Plan'
                                    ) : plan.price === 0 ? (
                                        'Free Forever'
                                    ) : (
                                        'Upgrade Now'
                                    )}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-16 text-gray-400"
                >
                    <p>Pembayaran aman dengan Midtrans. Bisa upgrade atau downgrade kapan saja.</p>
                </motion.div>
            </div>
        </div>
    )
}

export default function PricingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 text-white pt-20 pb-16 px-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <PricingContent />
        </Suspense>
    )
}
