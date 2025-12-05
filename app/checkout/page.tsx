'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    CreditCard,
    QrCode,
    Building2,
    Wallet,
    Loader2,
    Copy,
    Check,
    Clock,
    Shield,
    Smartphone
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

type PaymentMethod = 'qris' | 'bank_transfer' | 'gopay' | 'shopeepay' | null
type BankType = 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata'

interface PaymentData {
    orderId: string
    qrCodeUrl?: string
    vaNumber?: string
    bankCode?: string
    deepLinkUrl?: string
    expiryTime?: string
}

const banks: { id: BankType; name: string; logo: string }[] = [
    { id: 'bca', name: 'BCA', logo: '/banks/bca.png' },
    { id: 'bni', name: 'BNI', logo: '/banks/bni.png' },
    { id: 'bri', name: 'BRI', logo: '/banks/bri.png' },
    { id: 'mandiri', name: 'Mandiri', logo: '/banks/mandiri.png' },
    { id: 'permata', name: 'Permata', logo: '/banks/permata.png' },
]

function CheckoutContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { showToast } = useToast()

    const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
    const [selectedBank, setSelectedBank] = useState<BankType | null>(null)
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [copied, setCopied] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

    // Get plan data from URL
    const planId = searchParams.get('plan') || 'plus'
    const planName = searchParams.get('name') || 'Plus'
    const planPrice = parseInt(searchParams.get('price') || '29000')

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)
        }
        checkUser()
    }, [router])

    const handlePayment = async () => {
        if (!selectedMethod) return
        if (selectedMethod === 'bank_transfer' && !selectedBank) {
            showToast('Pilih bank terlebih dahulu', 'error')
            return
        }

        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            const res = await fetch('/api/midtrans/charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    planId,
                    price: planPrice,
                    paymentType: selectedMethod,
                    bank: selectedBank
                })
            })

            const data = await res.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setPaymentData({
                orderId: data.orderId,
                qrCodeUrl: data.qrCodeUrl,
                vaNumber: data.vaNumber,
                bankCode: data.bankCode,
                deepLinkUrl: data.deepLinkUrl,
                expiryTime: data.expiryTime
            })

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
            showToast(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const checkPaymentStatus = useCallback(async () => {
        if (!paymentData?.orderId) return

        try {
            setCheckingStatus(true)
            setPaymentStatus(null)
            const { data: { session } } = await supabase.auth.getSession()

            const res = await fetch('/api/midtrans/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ transactionId: paymentData.orderId })
            })

            const data = await res.json()

            // Show the actual status message
            setPaymentStatus(data.message || data.transactionStatus || 'Unknown')

            if (data.status === 'success') {
                // Only redirect if payment is actually successful
                showToast('Pembayaran berhasil!', 'success')
                setTimeout(() => {
                    router.push(`/thank-you?order_id=${paymentData.orderId}&plan=${planId}&name=${planName}`)
                }, 1500)
            }
        } catch (error) {
            console.error('Check status error:', error)
            setPaymentStatus('Error memeriksa status')
        } finally {
            setCheckingStatus(false)
        }
    }, [paymentData?.orderId, planId, planName, router, showToast])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        showToast('Berhasil disalin!', 'success')
        setTimeout(() => setCopied(false), 2000)
    }

    // Auto check payment status every 10 seconds when payment data exists
    useEffect(() => {
        if (!paymentData?.orderId) return

        const interval = setInterval(() => {
            checkPaymentStatus()
        }, 10000)

        return () => clearInterval(interval)
    }, [paymentData?.orderId, checkPaymentStatus])

    const renderPaymentMethods = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Pilih Metode Pembayaran</h3>

            {/* QRIS */}
            <button
                onClick={() => { setSelectedMethod('qris'); setSelectedBank(null) }}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedMethod === 'qris'
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
            >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                    <p className="font-semibold text-white">QRIS</p>
                    <p className="text-sm text-gray-400">Scan QR dengan aplikasi e-wallet apapun</p>
                </div>
                {selectedMethod === 'qris' && <Check className="w-5 h-5 text-primary" />}
            </button>

            {/* Bank Transfer */}
            <button
                onClick={() => setSelectedMethod('bank_transfer')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedMethod === 'bank_transfer'
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
            >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                    <p className="font-semibold text-white">Bank Transfer</p>
                    <p className="text-sm text-gray-400">Transfer via Virtual Account</p>
                </div>
                {selectedMethod === 'bank_transfer' && <Check className="w-5 h-5 text-primary" />}
            </button>

            {/* Bank Selection */}
            <AnimatePresence>
                {selectedMethod === 'bank_transfer' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-16 space-y-2 overflow-hidden"
                    >
                        {banks.map(bank => (
                            <button
                                key={bank.id}
                                onClick={() => setSelectedBank(bank.id)}
                                className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 ${selectedBank === bank.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 hover:border-white/30 bg-white/5'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded bg-white flex items-center justify-center overflow-hidden">
                                    <span className="text-xs font-bold text-gray-800">{bank.name}</span>
                                </div>
                                <span className="text-white font-medium">{bank.name}</span>
                                {selectedBank === bank.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GoPay */}
            <button
                onClick={() => { setSelectedMethod('gopay'); setSelectedBank(null) }}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedMethod === 'gopay'
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
            >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                    <p className="font-semibold text-white">GoPay</p>
                    <p className="text-sm text-gray-400">Bayar dengan GoPay</p>
                </div>
                {selectedMethod === 'gopay' && <Check className="w-5 h-5 text-primary" />}
            </button>

            {/* ShopeePay */}
            <button
                onClick={() => { setSelectedMethod('shopeepay'); setSelectedBank(null) }}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedMethod === 'shopeepay'
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
            >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                    <p className="font-semibold text-white">ShopeePay</p>
                    <p className="text-sm text-gray-400">Bayar dengan ShopeePay</p>
                </div>
                {selectedMethod === 'shopeepay' && <Check className="w-5 h-5 text-primary" />}
            </button>
        </div>
    )

    const renderPaymentInstructions = () => {
        if (!paymentData) return null

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Menunggu Pembayaran</h3>
                    <p className="text-gray-400 text-sm">
                        Selesaikan pembayaran sebelum waktu habis
                    </p>
                </div>

                {/* QRIS / GoPay QR Code */}
                {paymentData.qrCodeUrl && (
                    <div className="bg-white p-6 rounded-2xl mx-auto max-w-xs">
                        <Image
                            src={paymentData.qrCodeUrl}
                            alt="QR Code"
                            width={250}
                            height={250}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Virtual Account */}
                {paymentData.vaNumber && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-2">Nomor Virtual Account ({paymentData.bankCode?.toUpperCase()})</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-mono font-bold text-white tracking-wider">
                                {paymentData.vaNumber}
                            </span>
                            <button
                                onClick={() => copyToClipboard(paymentData.vaNumber!)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Deep Link for E-Wallet */}
                {paymentData.deepLinkUrl && (
                    <a
                        href={paymentData.deepLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-center transition-colors"
                    >
                        Buka Aplikasi {selectedMethod === 'gopay' ? 'GoPay' : 'ShopeePay'}
                    </a>
                )}

                {/* Amount */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Total Pembayaran</p>
                    <p className="text-2xl font-bold text-white">
                        Rp {planPrice.toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Check Status Button */}
                <button
                    onClick={checkPaymentStatus}
                    disabled={checkingStatus}
                    className="w-full py-3 bg-white text-black hover:bg-white/90 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {checkingStatus ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Memeriksa status...
                        </>
                    ) : (
                        'Cek Status Pembayaran'
                    )}
                </button>

                {/* Payment Status Display */}
                {paymentStatus && (
                    <div className={`p-4 rounded-xl text-center font-medium ${paymentStatus.includes('berhasil')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : paymentStatus.includes('Menunggu') || paymentStatus.includes('pending')
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {paymentStatus}
                    </div>
                )}

                <p className="text-center text-white/40 text-xs">
                    Status akan diperiksa otomatis setiap 10 detik
                </p>
            </motion.div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Pricing
                    </Link>
                    <h1 className="text-3xl font-bold">Checkout</h1>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left - Payment Methods / Instructions */}
                    <div className="lg:col-span-3">
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            {!paymentData ? renderPaymentMethods() : renderPaymentInstructions()}

                            {/* Pay Button (only show when no payment data yet) */}
                            {!paymentData && selectedMethod && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handlePayment}
                                    disabled={loading || (selectedMethod === 'bank_transfer' && !selectedBank)}
                                    className="w-full mt-6 py-4 bg-white text-black hover:bg-white/90 disabled:opacity-50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5" />
                                            Bayar Sekarang
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Right - Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-24">
                            <h3 className="text-lg font-semibold mb-4">Ringkasan Order</h3>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                                <p className="text-sm text-white/50">Paket yang dipilih</p>
                                <p className="text-xl font-semibold text-white">Beatly {planName}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Harga paket</span>
                                    <span>Rp {planPrice.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Biaya admin</span>
                                    <span className="text-green-500">Gratis</span>
                                </div>
                                <hr className="border-white/10" />
                                <div className="flex justify-between text-white font-bold text-lg">
                                    <span>Total</span>
                                    <span>Rp {planPrice.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Shield className="w-4 h-4" />
                                <span>Pembayaran aman dengan Midtrans</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    )
}
