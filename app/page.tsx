"use client";

import { useState, useEffect } from "react";
import TrackCard from "@/components/TrackCard";
import { TrackCardSkeleton } from "@/components/TrackCardSkeleton";
import { Track, ArtistFull } from "@/types";
import { usePlayer } from "@/app/context/PlayerContext";
import {
  Clock,
  ArrowRight,
  Music,
  Play,
  TrendingUp,
  Sparkles,
  Mic2,
  Disc3,
  Heart,
  Zap
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { event } from "@/components/GoogleAnalytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 18) return "Selamat Siang";
  return "Selamat Malam";
};

// Section header component
const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  showAll,
  href
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  showAll?: boolean;
  href?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex items-center justify-between mb-6"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
    </div>
    {showAll && href && (
      <Link
        href={href}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
      >
        Lihat Semua
        <ArrowRight className="w-4 h-4" />
      </Link>
    )}
  </motion.div>
);

// Quick play card component
const QuickPlayCard = ({
  track,
  onPlay
}: {
  track: Track;
  onPlay: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className="group relative flex items-center gap-3 bg-zinc-800/60 hover:bg-zinc-700/80 rounded-lg overflow-hidden cursor-pointer transition-all"
    onClick={onPlay}
  >
    <div className="relative w-16 h-16 flex-shrink-0">
      {track.album?.images?.[0]?.url ? (
        <Image
          src={track.album.images[0].url}
          alt={track.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
          <Music className="w-6 h-6 text-gray-500" />
        </div>
      )}
    </div>
    <p className="font-semibold text-white text-sm truncate flex-1 pr-2">
      {track.name}
    </p>
    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
      </div>
    </div>
  </motion.div>
);

// Genre card
const GenreCard = ({
  title,
  gradient,
  href
}: {
  title: string;
  gradient: string;
  href: string;
}) => (
  <Link href={href}>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`relative h-24 rounded-xl overflow-hidden cursor-pointer ${gradient}`}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 h-full flex items-end p-4">
        <p className="font-bold text-white text-lg">{title}</p>
      </div>
    </motion.div>
  </Link>
);

// Artist card with real image
const ArtistCard = ({
  artist,
  onClick
}: {
  artist: ArtistFull;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center cursor-pointer group"
    onClick={onClick}
  >
    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
      {artist.images?.[0]?.url ? (
        <Image
          src={artist.images[0].url}
          alt={artist.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center">
          <Mic2 className="w-8 h-8 text-primary" />
        </div>
      )}
    </div>
    <p className="text-sm text-gray-300 text-center group-hover:text-white transition-colors truncate w-full px-2">
      {artist.name}
    </p>
    <p className="text-xs text-gray-500">Artis</p>
  </motion.div>
);

export default function HomePage() {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [forYouTracks, setForYouTracks] = useState<Track[]>([]);
  const [forYouBasedOn, setForYouBasedOn] = useState<string[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [indonesianHits, setIndonesianHits] = useState<Track[]>([]);
  const [discoverTracks, setDiscoverTracks] = useState<Track[]>([]);
  const [popularArtists, setPopularArtists] = useState<ArtistFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const { playSong } = usePlayer();
  const { trackEvent, trackPlaySong } = useAnalytics();

  // Fetch user data and recently played
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "");

        // Fetch recently played
        try {
          const res = await fetch('/api/history?limit=8', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const tracks: Track[] = data.history.map((item: {
              track_id: string;
              track_name: string;
              artist_name: string;
              album_name: string | null;
              album_image: string | null;
            }) => ({
              id: item.track_id,
              name: item.track_name,
              artists: [{ id: '', name: item.artist_name }],
              album: {
                name: item.album_name || '',
                images: item.album_image ? [{ url: item.album_image, height: 300, width: 300 }] : []
              },
              preview_url: null
            }));
            setRecentlyPlayed(tracks);
          }
        } catch (error) {
          console.error('Error fetching recently played:', error);
        }

        // Fetch smart recommendations (For You)
        try {
          const res = await fetch('/api/recommendations?limit=12', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setForYouTracks(data.tracks || []);
            setForYouBasedOn(data.basedOn || []);
          }
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }
      }
    };
    fetchUserData();
  }, []);

  // Fetch music sections
  useEffect(() => {
    const fetchAllMusic = async () => {
      setIsLoading(true);
      try {
        // Fetch new releases for trending
        const newReleasesRes = await fetch('/api/spotify?type=new-releases&limit=20');
        if (newReleasesRes.ok) {
          const data = await newReleasesRes.json();
          const albums = data.albums?.items || [];

          // Get first track from each album
          const trendingPromises = albums.slice(0, 8).map(async (album: { name: string; artists: { name: string }[] }) => {
            const artistName = album.artists?.[0]?.name || '';
            const searchRes = await fetch(`/api/spotify?type=search&q=${encodeURIComponent(album.name + ' ' + artistName)}&limit=1`);
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              return searchData.tracks?.items?.[0];
            }
            return null;
          });

          const trendingResults = await Promise.all(trendingPromises);
          setTrendingTracks(trendingResults.filter((t): t is Track => t !== null && t.album?.images?.length > 0));
        }

        // Fetch Indonesian hits
        const indoArtists = ['Tulus', 'Fiersa Besari', 'Hindia', 'Nadin Amizah'];
        const indoPromises = indoArtists.map(artist =>
          fetch(`/api/spotify?type=search&q=artist:${encodeURIComponent(artist)}&limit=3`).then(res => res.json())
        );
        const indoResults = await Promise.all(indoPromises);
        const indoTracks = indoResults.flatMap(result => result.tracks?.items || [])
          .filter((track: Track) => track && track.album?.images?.length > 0);
        setIndonesianHits(indoTracks.slice(0, 6));

        // Fetch discover tracks
        const discoverArtists = ['Taylor Swift', 'Ed Sheeran', 'Coldplay', 'Bruno Mars'];
        const discoverPromises = discoverArtists.map(artist =>
          fetch(`/api/spotify?type=search&q=artist:${encodeURIComponent(artist)}&limit=4`).then(res => res.json())
        );
        const discoverResults = await Promise.all(discoverPromises);
        const allDiscoverTracks = discoverResults.flatMap(result => result.tracks?.items || [])
          .filter((track: Track) => track && track.album?.images?.length > 0);
        setDiscoverTracks(allDiscoverTracks.slice(0, 12));

        // Fetch popular artists with real images
        const artistNames = ['Taylor Swift', 'The Weeknd', 'Ed Sheeran', 'Tulus', 'Bruno Mars', 'Dua Lipa', 'Coldplay', 'Ariana Grande'];
        const artistPromises = artistNames.map(async (name) => {
          const res = await fetch(`/api/spotify?type=search&q=artist:${encodeURIComponent(name)}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            return data.artists?.items?.[0];
          }
          return null;
        });
        const artistResults = await Promise.all(artistPromises);
        setPopularArtists(artistResults.filter((a): a is ArtistFull => a !== null && a.images?.length > 0));

        event({
          action: 'homepage_loaded',
          category: 'page',
          label: 'Homepage loaded successfully',
          value: 1
        });
        trackEvent('homepage_loaded', { tracksCount: allDiscoverTracks.length });
      } catch (error) {
        console.error("Failed to fetch music:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllMusic();
  }, [trackEvent]);

  const handlePlaySong = (track: Track, tracks: Track[], index: number) => {
    event({
      action: 'play_song',
      category: 'music',
      label: `${track.name} - ${track.artists?.[0]?.name || 'Unknown Artist'}`,
      value: 1
    });
    trackPlaySong(`${track.name} - ${track.artists?.[0]?.name || 'Unknown Artist'}`);
    playSong(track, tracks, index);
  };

  const handleArtistClick = (artist: ArtistFull) => {
    trackEvent('artist_clicked', { artist: artist.name });
    window.location.href = `/search?q=${encodeURIComponent(artist.name)}`;
  };

  const TracksGrid = ({ tracks, columns = 6 }: { tracks: Track[]; columns?: number }) => (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${columns} gap-4`}>
      {tracks.map((track, index) => (
        <TrackCard
          key={`${track.id}-${index}`}
          track={track}
          onPlay={() => handlePlaySong(track, tracks, index)}
        />
      ))}
    </div>
  );

  const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => <TrackCardSkeleton key={i} />)}
    </div>
  );

  const genres = [
    { title: "Pop", gradient: "bg-gradient-to-br from-pink-500 to-rose-600", href: "/browse/pop" },
    { title: "Hip-Hop", gradient: "bg-gradient-to-br from-orange-500 to-amber-600", href: "/browse/hip-hop" },
    { title: "Rock", gradient: "bg-gradient-to-br from-red-600 to-red-800", href: "/browse/rock" },
    { title: "R&B", gradient: "bg-gradient-to-br from-purple-500 to-violet-700", href: "/browse/rnb" },
    { title: "Electronic", gradient: "bg-gradient-to-br from-cyan-500 to-blue-600", href: "/browse/electronic" },
    { title: "Jazz", gradient: "bg-gradient-to-br from-yellow-600 to-orange-700", href: "/browse/jazz" },
  ];

  return (
    <main className="bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white min-h-screen pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Greeting Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {getGreeting()}{isLoggedIn && userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-gray-400 mt-1">Apa yang ingin kamu dengarkan hari ini?</p>
        </motion.div>

        {/* Quick Play Section - Recently Played */}
        {isLoggedIn && recentlyPlayed.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              icon={Clock}
              title="Lanjutkan Mendengarkan"
              showAll
              href="/profile"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentlyPlayed.slice(0, 6).map((track, index) => (
                <QuickPlayCard
                  key={`quick-${track.id}-${index}`}
                  track={track}
                  onPlay={() => handlePlaySong(track, recentlyPlayed, index)}
                />
              ))}
            </div>
          </section>
        )}

        {/* For You Section - Smart Recommendations */}
        {isLoggedIn && forYouTracks.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              icon={Sparkles}
              title="Dibuat Untuk Kamu"
              subtitle={forYouBasedOn.length > 0 ? `Berdasarkan ${forYouBasedOn.join(', ')}` : 'Berdasarkan musik yang kamu dengarkan'}
              showAll
              href="/browse/for-you"
            />
            <TracksGrid tracks={forYouTracks.slice(0, 6)} columns={6} />
          </section>
        )}

        {/* Browse by Genre */}
        <section className="mb-10">
          <SectionHeader
            icon={Disc3}
            title="Jelajahi Genre"
            subtitle="Temukan musik berdasarkan mood kamu"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {genres.map((genre) => (
              <GenreCard
                key={genre.title}
                title={genre.title}
                gradient={genre.gradient}
                href={genre.href}
              />
            ))}
          </div>
        </section>

        {/* Trending Now - Real New Releases */}
        <section className="mb-10">
          <SectionHeader
            icon={TrendingUp}
            title="Trending Sekarang"
            subtitle="Lagu-lagu baru yang sedang populer"
            showAll
            href="/browse/trending"
          />
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : (
            <TracksGrid tracks={trendingTracks.slice(0, 6)} columns={6} />
          )}
        </section>

        {/* Indonesian Hits */}
        <section className="mb-10">
          <SectionHeader
            icon={Heart}
            title="Hits Indonesia"
            subtitle="Musik lokal terbaik"
            showAll
            href="/browse/indonesia"
          />
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : (
            <TracksGrid tracks={indonesianHits.slice(0, 6)} columns={6} />
          )}
        </section>

        {/* Discover New */}
        <section className="mb-10">
          <SectionHeader
            icon={Zap}
            title="Temukan Baru"
            subtitle="Rekomendasi untuk kamu"
          />
          {isLoading ? (
            <SkeletonGrid count={12} />
          ) : (
            <TracksGrid tracks={discoverTracks} columns={6} />
          )}
        </section>

        {/* Popular Artists with Real Images */}
        <section className="mb-10">
          <SectionHeader
            icon={Mic2}
            title="Artis Populer"
            subtitle="Artis favorit penikmat musik"
          />
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-zinc-800 animate-pulse mb-3" />
                  <div className="w-16 h-3 bg-zinc-800 animate-pulse rounded" />
                </div>
              ))
            ) : (
              popularArtists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onClick={() => handleArtistClick(artist)}
                />
              ))
            )}
          </div>
        </section>

      </div>

      {/* Premium Banner for non-logged in users */}
      {!isLoggedIn && (
        <section className="mt-8 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Dengarkan musik tanpa batas
                </h3>
                <p className="text-white/80">
                  Daftar sekarang dan nikmati akses ke jutaan lagu
                </p>
              </div>
              <Link
                href="/login"
                className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform whitespace-nowrap"
              >
                Daftar Gratis
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Beatly - Platform Musik Streaming
          </p>
        </div>
      </footer>
    </main>
  );
}