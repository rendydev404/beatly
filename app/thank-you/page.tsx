'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Home, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type PaymentStatus = 'verifying' | 'success' | 'pending' | 'failed'

function ThankYouContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<PaymentStatus>('verifying')
    const [planName, setPlanName] = useState('')

    const orderId = searchParams.get('order_id')
    const planParam = searchParams.get('plan') || 'plus'
    const nameParam = searchParams.get('name') || 'Plus'

    const verifyPayment = useCallback(async () => {
        // If no order_id, this is an invalid access
        if (!orderId) {
            setStatus('failed')
            return
        }

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
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

            if (data.status === 'success') {
                setStatus('success')
                setPlanName(data.plan || planParam)
            } else if (data.transactionStatus === 'pending') {
                setStatus('pending')
                setPlanName(nameParam)
            } else {
                setStatus('failed')
            }
        } catch (error) {
            console.error('Verification error:', error)
            setStatus('failed')
        }
    }, [orderId, planParam, nameParam, router])

    useEffect(() => {
        verifyPayment()
    }, [verifyPayment])

    // Auto-retry for pending payments
    useEffect(() => {
        if (status !== 'pending') return

        const interval = setInterval(() => {
            verifyPayment()
        }, 5000)

        return () => clearInterval(interval)
    }, [status, verifyPayment])

    // Verifying state
    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">Memverifikasi pembayaran...</p>
                </div>
            </div>
        )
    }

    // Failed state
    if (status === 'failed') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-semibold mb-2">Pembayaran Gagal</h1>
                    <p className="text-white/60 mb-8">
                        Pembayaran tidak dapat diverifikasi. Silakan coba lagi atau hubungi support.
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                    >
                        Kembali ke Pricing
                    </Link>
                </div>
            </div>
        )
    }

    // Pending state
    if (status === 'pending') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-semibold mb-2">Menunggu Pembayaran</h1>
                    <p className="text-white/60 mb-2">
                        Silakan selesaikan pembayaran Anda.
                    </p>
                    <p className="text-white/40 text-sm mb-8">
                        Halaman ini akan otomatis diperbarui setelah pembayaran berhasil.
                    </p>
                    <Link
                        href="/checkout"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Kembali ke Checkout
                    </Link>
                </div>
            </div>
        )
    }

    // Success state - elegant and minimal design
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full text-center"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-8"
                >
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1 className="text-3xl font-semibold mb-3">Pembayaran Berhasil</h1>
                    <p className="text-white/60 mb-8">
                        Selamat! Anda sekarang berlangganan <span className="text-white font-medium">Beatly {planName || nameParam}</span>
                    </p>
                </motion.div>

                {/* Plan Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-white/50 text-sm">Paket Aktif</span>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                            Aktif
                        </span>
                    </div>
                    <p className="text-xl font-semibold text-left">Beatly {planName || nameParam}</p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                >
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Mulai Mendengarkan
                    </Link>

                    <button
                        onClick={() => router.push('/pricing')}
                        className="flex items-center justify-center gap-2 w-full py-3 text-white/60 hover:text-white transition-colors text-sm"
                    >
                        Lihat Detail Paket
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-10 text-white/40 text-sm"
                >
                    Butuh bantuan?{' '}
                    <Link href="/contact" className="text-white/60 hover:text-white underline">
                        Hubungi kami
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    )
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    )
}
