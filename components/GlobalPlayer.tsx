// components/GlobalPlayer.tsx
"use client";

import Image from 'next/image';
import { usePlayer } from '@/app/context/PlayerContext';
import { Play, Pause, LoaderCircle, SkipBack, SkipForward, Repeat, Repeat1 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRouter } from 'next/navigation';

const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function GlobalPlayer() {
  const {
    activeTrack, isPlaying, isLoading, progress, duration, openNowPlayingView,
    togglePlayPause, seek, playNext, playPrevious, repeatMode, toggleRepeatMode
  } = usePlayer();
  const { trackPlaySong } = useAnalytics();
  const router = useRouter();

  if (!activeTrack) return null;
  const imageUrl = activeTrack.album.images?.[0]?.url;

  // Hitung persentase progres
  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  // Definisikan gaya untuk slider
  const sliderStyle = {
    background: `linear-gradient(to right, #6016ff ${progressPercentage}%, #52525b ${progressPercentage}%)`
  };

  return (
    <div onClick={openNowPlayingView} className="bg-zinc-900 fixed bottom-16 md:bottom-0 left-0 right-0 h-20 bg-surface border-t border-white/10 text-text-primary flex items-center px-2 md:px-4 z-40 cursor-pointer md:cursor-default">
      <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between md:justify-center gap-4">
        {/* Info Lagu & Mobile Controls */}
        <div className="flex items-center justify-between w-full md:w-1/4 md:justify-start">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {imageUrl && (
              <div
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/track/${activeTrack.id}`);
                }}
              >
                <Image
                  src={imageUrl}
                  alt={activeTrack.name}
                  width={56}
                  height={56}
                  className="rounded-md"
                />
              </div>
            )}
            <div className="min-w-0 flex-1 pr-2"> {/* Added padding-right untuk jarak dengan tombol */}
              <p className="font-semibold text-sm md:text-base leading-normal text-ellipsis overflow-hidden whitespace-nowrap" 
                 title={activeTrack.name}>
                {activeTrack.name}
              </p>
              <p className="text-xs text-text-secondary text-ellipsis overflow-hidden whitespace-nowrap"
                 title={activeTrack.artists.map(a => a.name).join(', ')}>
                {activeTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
          
          {/* Mobile Play Button - Moved inside info container */}
          <div className="md:hidden flex-shrink-0">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isPlaying && activeTrack) {
                  trackPlaySong(activeTrack.name);
                }
                togglePlayPause(); 
              }} 
              className="w-10 h-10 flex items-center justify-center bg-primary rounded-full"
            >
              {isLoading ? (
                <LoaderCircle size={20} className="animate-spin text-white" />
              ) : isPlaying ? (
                <Pause size={20} className="fill-white text-white" />
              ) : (
                <Play size={20} className="fill-white text-white ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Kontrol Desktop */} 
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); toggleRepeatMode(); }} className="text-text-secondary hover:text-text-primary"><Repeat1 size={20} className={repeatMode === 'one' ? 'text-primary' : 'hidden'} /><Repeat size={20} className={repeatMode !== 'one' ? (repeatMode === 'all' ? 'text-primary' : '') : 'hidden'} /></button>
                <button onClick={(e) => { e.stopPropagation(); playPrevious(); }} className="text-text-secondary hover:text-text-primary"><SkipBack /></button>
                <button onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!isPlaying && activeTrack) {
                    trackPlaySong(activeTrack.name);
                  }
                  togglePlayPause(); 
                 }} className="bg-text-primary text-white bg-primary rounded-full p-2 hover:scale-105">{isLoading ? <LoaderCircle size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}</button>
                <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="text-text-secondary hover:text-text-primary"><SkipForward /></button>
            </div>
            <div className="flex items-center gap-2 w-full max-w-lg">
                <span className="text-xs text-text-secondary">{formatTime(progress)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={progress}
                  onChange={(e) => seek(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  style={sliderStyle} // Terapkan gaya dinamis di sini
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
                <span className="text-xs text-text-secondary">{formatTime(duration)}</span>
            </div>
        </div>
        
      </div>
    </div>
  );
}