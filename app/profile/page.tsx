'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
    User,
    Music,
    Clock,
    Mic2,
    Calendar,
    Crown,
    Zap,
    Star,
    Play,
    Loader2,
    ArrowLeft,
    TrendingUp,
    Camera,
    Pencil,
    Check,
    X
} from 'lucide-react'
import { usePlayer } from '@/app/context/PlayerContext'
import { Track } from '@/types'

interface ProfileData {
    user: {
        id: string
        email: string
        created_at: string
        avatar_url: string | null
        full_name: string | null
    }
    subscription: {
        plan_id: string
        plan_name: string
        daily_limit: number
        daily_usage: number
    }
    stats: {
        total_songs_played: number
        unique_artists: number
        today_plays: number
        week_plays: number
        estimated_hours: number
        top_artist: { name: string; count: number } | null
    }
}

interface HistoryItem {
    id: string
    track_id: string
    track_name: string
    artist_name: string
    album_name: string | null
    album_image: string | null
    played_at: string
}

const planIcons: Record<string, typeof Crown> = {
    free: Star,
    plus: Zap,
    pro: Crown
}

const planColors: Record<string, string> = {
    free: 'bg-gray-600 text-gray-200',
    plus: 'bg-blue-600 text-blue-100',
    pro: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(true)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { playSong } = usePlayer()

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        await updateProfile(file, null)
    }

    const handleNameEdit = () => {
        if (profile) {
            setEditName(profile.user.full_name || profile.user.email.split('@')[0])
            setIsEditingName(true)
        }
    }

    const handleNameSave = async () => {
        if (editName.trim()) {
            await updateProfile(null, editName.trim())
            setIsEditingName(false)
        }
    }

    const handleNameCancel = () => {
        setIsEditingName(false)
        setEditName('')
    }

    const updateProfile = async (avatar: File | null, fullName: string | null) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            if (avatar) {
                formData.append('avatar', avatar)
            }
            if (fullName) {
                formData.append('full_name', fullName)
            }

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            })

            if (res.ok) {
                const result = await res.json()
                // Update local state
                if (profile) {
                    setProfile({
                        ...profile,
                        user: {
                            ...profile.user,
                            avatar_url: result.updates.avatar_url || profile.user.avatar_url,
                            full_name: result.updates.full_name || profile.user.full_name
                        }
                    })
                }

                // Refresh session to update user metadata across the app (including navbar)
                await supabase.auth.refreshSession()

                // Dispatch custom event for navbar to update
                window.dispatchEvent(new CustomEvent('profile-updated', {
                    detail: result.updates
                }))
            } else {
                const error = await res.json()
                console.error('Update failed:', error)
                alert(error.error || 'Gagal update profile')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Terjadi kesalahan saat update profile')
        } finally {
            setIsUploading(false)
        }
    }

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/login')
                return
            }

            try {
                // Fetch profile data
                const profileRes = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (profileRes.ok) {
                    const data = await profileRes.json()
                    setProfile(data)
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setLoading(false)
            }

            try {
                // Fetch listening history
                const historyRes = await fetch('/api/history?limit=20', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (historyRes.ok) {
                    const data = await historyRes.json()
                    setHistory(data.history || [])
                }
            } catch (error) {
                console.error('Error fetching history:', error)
            } finally {
                setHistoryLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatTimeAgo = (dateString: string) => {
        const now = new Date()
        const played = new Date(dateString)
        const diffMs = now.getTime() - played.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Baru saja'
        if (diffMins < 60) return `${diffMins} menit lalu`
        if (diffHours < 24) return `${diffHours} jam lalu`
        if (diffDays < 7) return `${diffDays} hari lalu`
        return formatDate(dateString)
    }

    const getInitials = (email: string) => {
        return email.charAt(0).toUpperCase()
    }

    const handlePlayFromHistory = (item: HistoryItem) => {
        // Create a track object from history item
        const track: Track = {
            id: item.track_id,
            name: item.track_name,
            artists: [{ id: '', name: item.artist_name }],
            album: {
                name: item.album_name || '',
                images: item.album_image ? [{ url: item.album_image, height: 300, width: 300 }] : []
            },
            preview_url: null
        }
        playSong(track)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 flex items-center justify-center pt-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 flex items-center justify-center pt-16">
                <p className="text-gray-400">Gagal memuat profil</p>
            </div>
        )
    }

    const PlanIcon = planIcons[profile.subscription.plan_id] || Star

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 text-white pt-20 pb-32 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali
                </motion.button>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12"
                >
                    {/* Avatar */}
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {profile.user.avatar_url ? (
                            <Image
                                src={profile.user.avatar_url}
                                alt="Profile"
                                width={120}
                                height={120}
                                className="rounded-full border-4 border-primary/30 w-28 h-28 md:w-32 md:h-32 object-cover"
                            />
                        ) : (
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl md:text-5xl font-bold border-4 border-primary/30">
                                {getInitials(profile.user.email)}
                            </div>
                        )}

                        {/* Upload overlay */}
                        <div className={`absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isUploading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-white" />
                            ) : (
                                <>
                                    <Camera className="w-6 h-6 text-white mb-1" />
                                    <span className="text-xs text-white">Ganti Foto</span>
                                </>
                            )}
                        </div>

                        {/* Plan Badge on Avatar */}
                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full ${planColors[profile.subscription.plan_id]} flex items-center justify-center shadow-lg`}>
                            <PlanIcon className="w-5 h-5" />
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="text-center md:text-left flex-1">
                        {/* Name with Edit Button */}
                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                            <h1 className="text-2xl md:text-3xl font-bold">
                                {profile.user.full_name || profile.user.email.split('@')[0]}
                            </h1>
                            <button
                                onClick={handleNameEdit}
                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                                title="Edit nama"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-3">{profile.user.email}</p>

                        {/* Edit Name Modal */}
                        {isEditingName && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                onClick={handleNameCancel}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Pencil className="w-5 h-5 text-primary" />
                                        Edit Nama Profil
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">
                                                Nama Lengkap
                                            </label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="Masukkan nama lengkap"
                                                className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleNameSave()
                                                    if (e.key === 'Escape') handleNameCancel()
                                                }}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={handleNameCancel}
                                                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleNameSave}
                                                disabled={isUploading || !editName.trim()}
                                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Menyimpan...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Simpan
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {/* Plan Badge */}
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${planColors[profile.subscription.plan_id]}`}>
                                <PlanIcon className="w-4 h-4" />
                                {profile.subscription.plan_name}
                            </span>

                            {/* Member Since */}
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Member sejak {formatDate(profile.user.created_at)}
                            </span>
                        </div>

                        {/* Daily Usage */}
                        <div className="mt-4 bg-zinc-800/50 rounded-lg p-3 max-w-xs mx-auto md:mx-0">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Penggunaan Hari Ini</span>
                                <span className="text-white font-medium">
                                    {profile.subscription.daily_usage} / {profile.subscription.daily_limit}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min((profile.subscription.daily_usage / profile.subscription.daily_limit) * 100, 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {/* Total Songs */}
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                            <Music className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl md:text-3xl font-bold">{profile.stats.total_songs_played}</p>
                        <p className="text-gray-400 text-sm">Lagu Diputar</p>
                    </div>

                    {/* Listening Time */}
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl md:text-3xl font-bold">{profile.stats.estimated_hours}h</p>
                        <p className="text-gray-400 text-sm">Waktu Dengar</p>
                    </div>

                    {/* Artists */}
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                            <Mic2 className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-2xl md:text-3xl font-bold">{profile.stats.unique_artists}</p>
                        <p className="text-gray-400 text-sm">Artis</p>
                    </div>

                    {/* This Week */}
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-2xl md:text-3xl font-bold">{profile.stats.week_plays}</p>
                        <p className="text-gray-400 text-sm">Minggu Ini</p>
                    </div>
                </motion.div>

                {/* Top Artist */}
                {profile.stats.top_artist && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-2xl p-6 mb-12 border border-primary/20"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-primary/30 flex items-center justify-center">
                                <Crown className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Artis Favorit Kamu</p>
                                <p className="text-xl md:text-2xl font-bold">{profile.stats.top_artist.name}</p>
                                <p className="text-primary text-sm">{profile.stats.top_artist.count} lagu diputar</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Recently Played */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-primary" />
                        Riwayat Diputar
                    </h2>

                    {historyLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-800/30 rounded-2xl">
                            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">Belum ada lagu yang diputar</p>
                            <p className="text-gray-500 text-sm mt-2">Mulai dengarkan musik untuk melihat riwayat kamu</p>
                            <button
                                onClick={() => router.push('/search')}
                                className="mt-6 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition"
                            >
                                Jelajahi Musik
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer"
                                    onClick={() => handlePlayFromHistory(item)}
                                >
                                    {/* Album Art */}
                                    <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
                                        {item.album_image ? (
                                            <Image
                                                src={item.album_image}
                                                alt={item.album_name || item.track_name}
                                                fill
                                                className="rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-lg bg-zinc-700 flex items-center justify-center">
                                                <Music className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                        {/* Play overlay */}
                                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="w-5 h-5 text-white fill-white" />
                                        </div>
                                    </div>

                                    {/* Track Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate group-hover:text-primary transition-colors">
                                            {item.track_name}
                                        </p>
                                        <p className="text-gray-400 text-sm truncate">
                                            {item.artist_name}
                                        </p>
                                    </div>

                                    {/* Time */}
                                    <p className="text-gray-500 text-sm flex-shrink-0 hidden sm:block">
                                        {formatTimeAgo(item.played_at)}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
