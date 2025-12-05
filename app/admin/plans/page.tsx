'use client'

import { useState, useEffect } from 'react'
import { Save, Loader, Plus, Trash2, GripVertical } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Plan {
    id: string
    name: string
    price: number
    daily_limit: number
    features: string[]
    duration_type: 'day' | 'week' | 'month' | 'year'
    duration_value: number
    is_popular: boolean
}

const defaultFeatures = [
    '25 Songs/Day',
    'Ads Support',
    'Standard Quality'
]

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [editingPlan, setEditingPlan] = useState<string | null>(null)
    const { showToast } = useToast()

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans')
            const data = await res.json()
            // Transform data to include features array if not exists
            const transformedData = data.map((plan: Plan) => ({
                ...plan,
                features: plan.features || defaultFeatures,
                duration_type: plan.duration_type || 'month',
                duration_value: plan.duration_value || 1,
                is_popular: plan.is_popular || false
            }))
            setPlans(transformedData)
        } catch (error) {
            console.error('Error fetching plans:', error)
            showToast('Error fetching plans', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (plan: Plan) => {
        setSaving(plan.id)
        try {
            const res = await fetch('/api/admin/plans', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': 'Rendy@123'
                },
                body: JSON.stringify({
                    id: plan.id,
                    name: plan.name,
                    price: plan.price,
                    daily_limit: plan.daily_limit,
                    features: plan.features,
                    duration_type: plan.duration_type,
                    duration_value: plan.duration_value,
                    is_popular: plan.is_popular
                })
            })

            if (!res.ok) throw new Error('Failed to update')

            showToast('Plan updated successfully!', 'success')
            setEditingPlan(null)
        } catch {
            showToast('Error updating plan', 'error')
        } finally {
            setSaving(null)
        }
    }

    const updatePlanField = (planId: string, field: keyof Plan, value: unknown) => {
        setPlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p))
    }

    const addFeature = (planId: string) => {
        setPlans(plans.map(p => {
            if (p.id === planId) {
                return { ...p, features: [...p.features, 'New Feature'] }
            }
            return p
        }))
    }

    const removeFeature = (planId: string, index: number) => {
        setPlans(plans.map(p => {
            if (p.id === planId) {
                const newFeatures = [...p.features]
                newFeatures.splice(index, 1)
                return { ...p, features: newFeatures }
            }
            return p
        }))
    }

    const updateFeature = (planId: string, index: number, value: string) => {
        setPlans(plans.map(p => {
            if (p.id === planId) {
                const newFeatures = [...p.features]
                newFeatures[index] = value
                return { ...p, features: newFeatures }
            }
            return p
        }))
    }

    const getDurationLabel = (type: string, value: number) => {
        const labels: Record<string, { singular: string; plural: string }> = {
            day: { singular: 'Hari', plural: 'Hari' },
            week: { singular: 'Minggu', plural: 'Minggu' },
            month: { singular: 'Bulan', plural: 'Bulan' },
            year: { singular: 'Tahun', plural: 'Tahun' }
        }
        const label = labels[type]
        return `${value} ${value > 1 ? label.plural : label.singular}`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Manage Subscription Plans</h1>
                <p className="text-gray-400">Edit harga, fitur, dan durasi untuk setiap paket langganan</p>
            </div>

            <div className="space-y-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl border transition-all ${editingPlan === plan.id
                                ? 'border-primary shadow-lg shadow-primary/10'
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                    >
                        {/* Plan Header */}
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                                            {plan.is_popular && (
                                                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                                                    POPULER
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">ID: {plan.id}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${editingPlan === plan.id
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                                        }`}
                                >
                                    {editingPlan === plan.id ? 'Tutup Editor' : 'Edit Plan'}
                                </button>
                            </div>
                        </div>

                        {/* Plan Content */}
                        <div className="p-6">
                            {/* Quick View / Edit Mode */}
                            {editingPlan === plan.id ? (
                                <div className="space-y-6">
                                    {/* Basic Info Grid */}
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Plan Name */}
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Nama Plan</label>
                                            <input
                                                type="text"
                                                value={plan.name}
                                                onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
                                            />
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Harga (IDR)</label>
                                            <input
                                                type="number"
                                                value={plan.price}
                                                onChange={(e) => updatePlanField(plan.id, 'price', Number(e.target.value))}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
                                                disabled={plan.id === 'free'}
                                            />
                                        </div>

                                        {/* Daily Limit */}
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Limit Harian (Lagu)</label>
                                            <input
                                                type="number"
                                                value={plan.daily_limit}
                                                onChange={(e) => updatePlanField(plan.id, 'daily_limit', Number(e.target.value))}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
                                            />
                                        </div>

                                        {/* Popular Toggle */}
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Status</label>
                                            <button
                                                onClick={() => updatePlanField(plan.id, 'is_popular', !plan.is_popular)}
                                                className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all ${plan.is_popular
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}
                                            >
                                                {plan.is_popular ? '⭐ Populer' : 'Biasa'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Duration Settings */}
                                    <div className="bg-gray-900/50 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold text-white mb-4">⏱️ Durasi Langganan</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Jenis Durasi</label>
                                                <select
                                                    value={plan.duration_type}
                                                    onChange={(e) => updatePlanField(plan.id, 'duration_type', e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
                                                    disabled={plan.id === 'free'}
                                                >
                                                    <option value="day">Hari</option>
                                                    <option value="week">Minggu</option>
                                                    <option value="month">Bulan</option>
                                                    <option value="year">Tahun</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Jumlah Durasi</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={plan.duration_value}
                                                    onChange={(e) => updatePlanField(plan.id, 'duration_value', Number(e.target.value))}
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
                                                    disabled={plan.id === 'free'}
                                                />
                                            </div>
                                        </div>
                                        {plan.id !== 'free' && (
                                            <p className="mt-3 text-sm text-gray-500">
                                                Preview: Langganan berlaku selama <span className="text-primary font-medium">{getDurationLabel(plan.duration_type, plan.duration_value)}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Features Editor */}
                                    <div className="bg-gray-900/50 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-semibold text-white">✨ Fitur & Kelebihan</h4>
                                            <button
                                                onClick={() => addFeature(plan.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg hover:bg-primary/20 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Tambah Fitur
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {plan.features.map((feature, index) => (
                                                <div key={index} className="flex items-center gap-2 group">
                                                    <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                                                    <input
                                                        type="text"
                                                        value={feature}
                                                        onChange={(e) => updateFeature(plan.id, index, e.target.value)}
                                                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                                                        placeholder="Contoh: 50 Songs/Day"
                                                    />
                                                    <button
                                                        onClick={() => removeFeature(plan.id, index)}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end pt-4 border-t border-gray-700">
                                        <button
                                            onClick={() => handleUpdate(plan)}
                                            disabled={saving === plan.id}
                                            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-all"
                                        >
                                            {saving === plan.id ? (
                                                <Loader className="animate-spin w-4 h-4" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Quick View Mode */
                                <div className="grid md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Harga</p>
                                        <p className="text-lg font-bold text-white">
                                            {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Limit Harian</p>
                                        <p className="text-lg font-bold text-white">{plan.daily_limit} Lagu</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Durasi</p>
                                        <p className="text-lg font-bold text-white">
                                            {plan.id === 'free' ? 'Selamanya' : getDurationLabel(plan.duration_type, plan.duration_value)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Fitur</p>
                                        <p className="text-lg font-bold text-white">{plan.features.length} Item</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Card */}
            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                    <strong>💡 Tips:</strong> Perubahan pada fitur dan durasi akan langsung terlihat di halaman pricing.
                    Pastikan untuk menyimpan perubahan setelah mengedit.
                </p>
            </div>
        </div>
    )
}
