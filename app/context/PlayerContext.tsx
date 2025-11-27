// app/context/PlayerContext.tsx
"use client";

import { createContext, useState, useContext, useRef, useEffect, ReactNode } from 'react';
import { Track } from '@/types';
import { searchYouTubeForSong } from '@/lib/youtube';
import YouTubePlayer from '@/components/YouTubePlayer';
import NowPlayingView from '@/components/NowPlayingView';

type RepeatMode = 'none' | 'one' | 'all';

// Tipe spesifik untuk event dan instance dari YouTube Player
export interface YouTubeEvent {
  target: any;
  data: number;
}
interface PlayerInstance {
  getCurrentTime: () => number;
  getDuration: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (time: number, allowSeekAhead?: boolean) => void;
}

interface PlayerContextType {
  activeTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  isNowPlayingViewOpen: boolean;
  playSong: (track: Track, queue?: Track[], index?: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleRepeatMode: () => void;
  seek: (time: number) => void;
  openNowPlayingView: () => void;
  closeNowPlayingView: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isNowPlayingViewOpen, setNowPlayingViewOpen] = useState(false);

  const playerRef = useRef<PlayerInstance | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        setProgress(playerRef.current.getCurrentTime() || 0);
      }
    }, 1000);
  };
  const stopTimer = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  useEffect(() => { return () => stopTimer(); }, []);

  const loadAndPlaySong = async (track: Track) => {
    setIsLoading(true);
    setIsPlaying(false);
    setActiveTrack(track);
    setYoutubeVideoId(null);
    const videoId = await searchYouTubeForSong(track.name, track.artists[0]?.name || '');
    setIsLoading(false);
    if (videoId) {
      setYoutubeVideoId(videoId);
      setIsPlaying(true);
    } else {
      console.error("Lagu tidak ditemukan:", track.name);
      if (queue.length > 1) {
        alert("Maaf, lagu tidak dapat ditemukan. Mencoba lagu berikutnya.");
        playNext();
      } else {
        alert("Maaf, lagu tidak dapat ditemukan. Silakan coba lagu lain.");
      }
      playNext();
    }
  };

  const playSong = (track: Track, newQueue: Track[] = [track], index: number = 0) => {
    if (activeTrack?.id === track.id) {
        togglePlayPause();
        return;
    }
    setQueue(newQueue);
    setCurrentIndex(index);
    loadAndPlaySong(track);
  };
  
  const playNext = () => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1);
    if (nextIndex >= queue.length && repeatMode !== 'all') {
        setIsPlaying(false);
        setActiveTrack(null);
        setYoutubeVideoId(null);
        return;
    }
    const finalIndex = nextIndex % queue.length;
    setCurrentIndex(finalIndex);
    loadAndPlaySong(queue[finalIndex]);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;
    if (progress > 3) {
      playerRef.current?.seekTo(0);
      return;
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIndex);
    loadAndPlaySong(queue[prevIndex]);
  };

  const startRadio = async () => {
    if (!activeTrack || !activeTrack.artists[0]?.id) return;
    
    console.log(`Memulai Radio berdasarkan artis: ${activeTrack.artists[0].name}`);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/spotify?type=recommendations&seed_artists=${activeTrack.artists[0].id}&limit=10`);
      const data = await res.json();
      
      const recommendedTracks = data.tracks || [];
      
      if (recommendedTracks.length > 0) {
        const newQueue = [...queue.slice(0, currentIndex + 1), ...recommendedTracks];
        setQueue(newQueue);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        loadAndPlaySong(newQueue[nextIndex]);
      } else {
        setIsPlaying(false);
        setActiveTrack(null);
      }
    } catch (error) {
      console.error("Gagal mengambil rekomendasi radio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================================================================
  // PERBAIKAN: Logika di sini diperbaiki agar radio berjalan dengan benar
  // ==================================================================
  const onPlayerStateChange = (event: YouTubeEvent) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
      if (playerRef.current) setDuration(playerRef.current.getDuration());
      startTimer();
    } else if (event.data === 2) { // Paused
      setIsPlaying(false);
      stopTimer();
    } else if (event.data === 0) { // Ended
      if (repeatMode === 'one') {
        playerRef.current?.seekTo(0, true);
        return;
      }
      if (repeatMode === 'all') {
        playNext();
        return;
      }
      // Untuk mode 'none'
      const isLastSongInQueue = currentIndex >= queue.length - 1;
      if (isLastSongInQueue) {
        startRadio(); // Hanya mulai radio jika lagu terakhir habis
      } else {
        playNext(); // Jika tidak, mainkan lagu berikutnya di antrean
      }
    }
  };
  
  const toggleRepeatMode = () => setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  const togglePlayPause = () => { if (isPlaying) playerRef.current?.pauseVideo(); else playerRef.current?.playVideo(); };
  const seek = (time: number) => { playerRef.current?.seekTo(time, true); };
  const openNowPlayingView = () => setNowPlayingViewOpen(true);
  const closeNowPlayingView = () => setNowPlayingViewOpen(false);
  const onPlayerReady = (event: YouTubeEvent) => { playerRef.current = event.target; };
  const onPlayerError = (event: YouTubeEvent) => { console.error("YouTube Player Error:", event.data); setIsPlaying(false); stopTimer(); };

  const value = {
    activeTrack, isPlaying, isLoading, progress, duration, repeatMode, isNowPlayingViewOpen,
    playSong, togglePlayPause, playNext, playPrevious, toggleRepeatMode, seek, openNowPlayingView, closeNowPlayingView,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {isNowPlayingViewOpen && <NowPlayingView />}
      <YouTubePlayer videoId={youtubeVideoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} onError={onPlayerError} />
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) throw new Error('usePlayer harus digunakan di dalam PlayerProvider');
  return context;
};