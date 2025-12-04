'use client'

import { useState, useEffect } from 'react'
import { Save, Loader } from 'lucide-react'

interface Plan {
    id: string
    name: string
    price: number
    daily_limit: number
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans')
            const data = await res.json()
            setPlans(data)
        } catch (error) {
            console.error('Error fetching plans:', error)
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
                    'x-admin-password': 'Rendy@123' // Hardcoded to match layout
                },
                body: JSON.stringify({
                    id: plan.id,
                    price: plan.price,
                    daily_limit: plan.daily_limit
                })
            })

            if (!res.ok) throw new Error('Failed to update')

            alert('Plan updated successfully')
        } catch (error) {
            alert('Error updating plan')
        } finally {
            setSaving(null)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading plans...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Manage Subscription Plans</h1>

            <div className="grid gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">ID: {plan.id}</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Price (IDR)</label>
                                <input
                                    type="number"
                                    value={plan.price}
                                    onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? { ...p, price: Number(e.target.value) } : p))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                                    disabled={plan.id === 'free'} // Free plan usually 0
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Daily Limit (Songs)</label>
                                <input
                                    type="number"
                                    value={plan.daily_limit}
                                    onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? { ...p, daily_limit: Number(e.target.value) } : p))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => handleUpdate(plan)}
                                disabled={saving === plan.id}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 disabled:opacity-50"
                            >
                                {saving === plan.id ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
