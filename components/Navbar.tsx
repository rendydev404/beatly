"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, ChevronDown, Search, Crown, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Track } from '@/types';
import { usePlayer } from '@/app/context/PlayerContext';
import { useDebounce } from '@/hooks/useDebounce';
import TrackListItem from '@/components/TrackListItem';
import { TrackListSkeleton } from '@/components/TrackCardSkeleton';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const router = useRouter();
    const { playSong } = usePlayer();
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const debouncedQuery = useDebounce(searchQuery, 400);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            }
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Perform search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim() === '') {
            setSearchResults([]);
            setSearchError(null);
            return;
        }

        performSearch(debouncedQuery.trim());
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (query: string) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsSearching(true);
            setSearchError(null);

            const res = await fetch(
                `/api/spotify?q=${encodeURIComponent(query)}&type=track&limit=8`,
                { signal: abortControllerRef.current.signal }
            );

            if (!res.ok) {
                throw new Error('Failed to fetch');
            }

            const data = await res.json();

            if (!data || !data.tracks || !Array.isArray(data.tracks.items)) {
                throw new Error('Invalid response format');
            }

            const validTracks = data.tracks.items.filter((track: Track) => {
                return track &&
                    track.id &&
                    track.name &&
                    track.album &&
                    Array.isArray(track.album.images) &&
                    track.album.images.length > 0;
            });

            setSearchResults(validTracks);
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    return;
                }
                setSearchError(err.message);
            }
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handlePlaySong = (track: Track, index: number) => {
        playSong(track, searchResults, index);
        setIsSearchFocused(false);
        setSearchQuery('');
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const showSearchDropdown = isSearchFocused && searchQuery.length > 0;

    return (
        <nav className="w-full h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 z-50 shadow-lg shadow-purple-500/5">
            {/* Left - Logo */}
            <Link href="/" className="flex items-center gap-2 group">
                <div className="relative">
                    <Image
                        src="/spotify-logo.png"
                        alt="Logo"
                        width={36}
                        height={36}
                        className="rounded-full transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-white font-bold text-lg hidden sm:block">Beatly</span>
            </Link>

            {/* Center - Search Bar with Dropdown */}
            <div ref={searchContainerRef} className="flex-1 max-w-xl mx-4 relative">
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className={`relative flex items-center bg-white/10 hover:bg-white/15 transition-all border border-white/10 hover:border-primary/30 ${showSearchDropdown ? 'rounded-t-2xl rounded-b-none' : 'rounded-full'}`}>
                        <Search className="w-5 h-5 text-gray-400 ml-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            placeholder="Cari lagu, artis, atau album..."
                            className="w-full bg-transparent text-white placeholder-gray-400 px-3 py-2.5 outline-none text-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="mr-3 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {showSearchDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-zinc-900/98 backdrop-blur-xl rounded-b-2xl shadow-2xl border border-white/10 border-t-0 max-h-[60vh] overflow-y-auto z-50">
                        {isSearching ? (
                            <div className="p-3 space-y-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <TrackListSkeleton key={i} />
                                ))}
                            </div>
                        ) : searchError ? (
                            <div className="p-4 text-center">
                                <p className="text-red-400 text-sm">Terjadi kesalahan. Silakan coba lagi.</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="py-2">
                                <p className="px-4 py-2 text-xs text-zinc-400 uppercase font-semibold">Hasil Pencarian</p>
                                <div className="space-y-1">
                                    {searchResults.map((track, index) => (
                                        <TrackListItem
                                            key={track.id}
                                            track={track}
                                            onPlay={() => handlePlaySong(track, index)}
                                        />
                                    ))}
                                </div>
                                <Link
                                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                                    className="block px-4 py-3 text-sm text-primary hover:bg-white/5 transition-colors text-center border-t border-white/10 mt-2"
                                    onClick={() => setIsSearchFocused(false)}
                                >
                                    Lihat semua hasil untuk &quot;{searchQuery}&quot;
                                </Link>
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-zinc-400 text-sm">
                                    Tidak ada hasil untuk &quot;{searchQuery}&quot;
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3">
                {/* Upgrade Plan Button */}
                <Link
                    href="/pricing"
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-full text-white text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
                >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade Plan</span>
                </Link>

                {user ? (
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full p-1.5 pr-3 transition-all cursor-pointer border border-white/10 hover:border-primary/30"
                        >
                            {user.user_metadata.avatar_url ? (
                                <Image
                                    src={user.user_metadata.avatar_url}
                                    alt="User Avatar"
                                    width={28}
                                    height={28}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="w-7 h-7 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                                    <UserIcon size={16} className="text-white" />
                                </div>
                            )}
                            <span className="text-white text-sm font-medium truncate max-w-[80px] hidden sm:block">
                                {user.user_metadata.full_name || user.email?.split('@')[0]}
                            </span>
                            <ChevronDown size={16} className={`text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-2xl py-2 border border-white/10 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary/10 to-purple-600/10">
                                    <p className="text-sm text-white font-medium truncate">{user.user_metadata.full_name}</p>
                                    <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                                </div>
                                <Link
                                    href="/pricing"
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-white/5 transition-colors md:hidden"
                                >
                                    <Crown size={14} />
                                    Upgrade Plan
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={14} />
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-zinc-300 hover:text-white font-medium transition-colors text-sm hidden sm:block"
                        >
                            Daftar
                        </Link>
                        <Link
                            href="/login"
                            className="bg-white text-black px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform text-sm"
                        >
                            Masuk
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
