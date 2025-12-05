'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import TrackCard from '@/components/TrackCard'
import { TrackCardSkeleton } from '@/components/TrackCardSkeleton'
import { Track } from '@/types'
import { usePlayer } from '@/app/context/PlayerContext'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft,
    TrendingUp,
    Heart,
    Sparkles,
    Disc3,
    Music,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { event } from '@/components/GoogleAnalytics'

// Category configuration
const categoryConfig: Record<string, {
    title: string
    subtitle: string
    icon: React.ElementType
    gradient: string
    fetchType: string
}> = {
    'trending': {
        title: 'Trending Sekarang',
        subtitle: 'Lagu-lagu yang sedang viral dan populer',
        icon: TrendingUp,
        gradient: 'from-orange-500 to-red-600',
        fetchType: 'new-releases'
    },
    'indonesia': {
        title: 'Hits Indonesia',
        subtitle: 'Musik lokal terbaik dari artis Indonesia',
        icon: Heart,
        gradient: 'from-red-500 to-pink-600',
        fetchType: 'indonesia'
    },
    'for-you': {
        title: 'Dibuat Untuk Kamu',
        subtitle: 'Rekomendasi berdasarkan musik yang kamu dengarkan',
        icon: Sparkles,
        gradient: 'from-purple-500 to-pink-600',
        fetchType: 'recommendations'
    },
    'pop': {
        title: 'Pop',
        subtitle: 'Lagu-lagu pop terpopuler',
        icon: Disc3,
        gradient: 'from-pink-500 to-rose-600',
        fetchType: 'genre-pop'
    },
    'hip-hop': {
        title: 'Hip-Hop',
        subtitle: 'Beats dan rhymes terbaik',
        icon: Disc3,
        gradient: 'from-orange-500 to-amber-600',
        fetchType: 'genre-hip-hop'
    },
    'rock': {
        title: 'Rock',
        subtitle: 'Musik rock dari klasik hingga modern',
        icon: Disc3,
        gradient: 'from-red-600 to-red-800',
        fetchType: 'genre-rock'
    },
    'rnb': {
        title: 'R&B',
        subtitle: 'Rhythm and blues terbaik',
        icon: Disc3,
        gradient: 'from-purple-500 to-violet-700',
        fetchType: 'genre-r-n-b'
    },
    'electronic': {
        title: 'Electronic',
        subtitle: 'EDM, dance, dan electronic music',
        icon: Disc3,
        gradient: 'from-cyan-500 to-blue-600',
        fetchType: 'genre-electronic'
    },
    'jazz': {
        title: 'Jazz',
        subtitle: 'Musik jazz klasik dan kontemporer',
        icon: Disc3,
        gradient: 'from-yellow-600 to-orange-700',
        fetchType: 'genre-jazz'
    }
}

export default function BrowsePage() {
    const params = useParams()
    const category = params.category as string
    const [tracks, setTracks] = useState<Track[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [basedOn, setBasedOn] = useState<string[]>([])
    const { playSong } = usePlayer()

    const config = categoryConfig[category] || {
        title: category.charAt(0).toUpperCase() + category.slice(1),
        subtitle: 'Jelajahi musik',
        icon: Music,
        gradient: 'from-zinc-600 to-zinc-800',
        fetchType: 'search'
    }

    const Icon = config.icon

    useEffect(() => {
        const fetchTracks = async () => {
            setIsLoading(true)
            try {
                let fetchedTracks: Track[] = []

                // For personalized recommendations
                if (config.fetchType === 'recommendations') {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) {
                        const res = await fetch('/api/recommendations?limit=50', {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        })
                        if (res.ok) {
                            const data = await res.json()
                            fetchedTracks = data.tracks || []
                            setBasedOn(data.basedOn || [])
                        }
                    }
                }
                // For new releases / trending
                else if (config.fetchType === 'new-releases') {
                    const res = await fetch('/api/spotify?type=new-releases&limit=50')
                    if (res.ok) {
                        const data = await res.json()
                        // Get tracks from albums
                        const albums = data.albums?.items || []
                        // Fetch first track from each album
                        for (const album of albums.slice(0, 30)) {
                            const artistName = album.artists?.[0]?.name || ''
                            const searchRes = await fetch(`/api/spotify?type=search&q=${encodeURIComponent(album.name + ' ' + artistName)}&limit=1`)
                            if (searchRes.ok) {
                                const searchData = await searchRes.json()
                                if (searchData.tracks?.items?.[0]) {
                                    fetchedTracks.push(searchData.tracks.items[0])
                                }
                            }
                        }
                    }
                }
                // For Indonesian music
                else if (config.fetchType === 'indonesia') {
                    const indoArtists = ['Tulus', 'Fiersa Besari', 'Hindia', 'Nadin Amizah', 'Pamungkas', 'Ardhito Pramono', 'Yura Yunita', 'Rizky Febian']
                    for (const artist of indoArtists) {
                        const res = await fetch(`/api/spotify?type=search&q=artist:${encodeURIComponent(artist)}&limit=6`)
                        if (res.ok) {
                            const data = await res.json()
                            const artistTracks = data.tracks?.items || []
                            fetchedTracks.push(...artistTracks)
                        }
                    }
                }
                // For genre-based
                else if (config.fetchType.startsWith('genre-')) {
                    const genre = config.fetchType.replace('genre-', '')
                    const res = await fetch(`/api/spotify?type=genre&genre=${encodeURIComponent(genre)}&limit=50`)
                    if (res.ok) {
                        const data = await res.json()
                        fetchedTracks = data.tracks?.items || []
                    }
                }
                // Default search
                else {
                    const res = await fetch(`/api/spotify?type=search&q=${encodeURIComponent(category)}&limit=50`)
                    if (res.ok) {
                        const data = await res.json()
                        fetchedTracks = data.tracks?.items || []
                    }
                }

                // Filter valid tracks with images
                const validTracks = fetchedTracks.filter(track =>
                    track && track.id && track.name && track.album?.images?.length > 0
                )

                // Remove duplicates by track ID
                const uniqueTracks = validTracks.filter((track, index, self) =>
                    index === self.findIndex(t => t.id === track.id)
                )

                setTracks(uniqueTracks)

                event({
                    action: 'browse_page_loaded',
                    category: 'navigation',
                    label: category,
                    value: uniqueTracks.length
                })
            } catch (error) {
                console.error('Error fetching tracks:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTracks()
    }, [category, config.fetchType])

    const handlePlaySong = (track: Track, index: number) => {
        event({
            action: 'play_song',
            category: 'music',
            label: `${track.name} - ${track.artists?.[0]?.name || 'Unknown'}`,
            value: 1
        })
        playSong(track, tracks, index)
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white pt-16 pb-32">
            {/* Header */}
            <div className={`bg-gradient-to-b ${config.gradient} to-transparent pb-16 pt-8`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                            <Icon className="w-10 h-10 md:w-14 md:h-14 text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-sm uppercase tracking-wider mb-1">Koleksi</p>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                                {config.title}
                            </h1>
                            <p className="text-white/80 text-lg">
                                {config.subtitle}
                            </p>
                            {basedOn.length > 0 && (
                                <p className="text-white/60 text-sm mt-2">
                                    Berdasarkan artis favoritmu: {basedOn.join(', ')}
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Tracks Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8">
                <div className="bg-zinc-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/5">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <TrackCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="text-center py-16">
                            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">
                                {config.fetchType === 'recommendations'
                                    ? 'Dengarkan beberapa lagu dulu untuk mendapatkan rekomendasi personal'
                                    : 'Tidak ada lagu ditemukan'
                                }
                            </p>
                            {config.fetchType === 'recommendations' && (
                                <Link
                                    href="/"
                                    className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition"
                                >
                                    Jelajahi Musik
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-400 text-sm mb-6">{tracks.length} lagu</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {tracks.map((track, index) => (
                                    <TrackCard
                                        key={`${track.id}-${index}`}
                                        track={track}
                                        onPlay={() => handlePlaySong(track, index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
