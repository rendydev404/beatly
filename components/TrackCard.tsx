// components/TrackCard.tsx
import { Track } from "@/types";
import { Play, Music2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TrackCardProps {
  track: Track;
  onPlay: () => void;
}

export default function TrackCard({ track, onPlay }: TrackCardProps) {
  const router = useRouter();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  const handleCardClick = () => {
    router.push(`/track/${track.id}`);
  };

  return (
    <div
      className="group relative cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Glow Effect Background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-75 blur-lg transition-all duration-500 group-hover:duration-200"></div>

      {/* Card Container */}
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800/90 to-zinc-900 rounded-2xl p-4 border border-white/5 group-hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-0 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 -right-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl"></div>
        </div>

        {/* Album Art Container */}
        <div className="relative mb-4 group/image">
          {/* Image Wrapper */}
          <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl">
            <img
              src={track.album?.images?.[0]?.url || '/spotify-logo.png'}
              alt={track.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Music Visualizer Bars */}
            <div className="absolute bottom-3 left-3 flex items-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '12px', animationDelay: '0ms' }}></div>
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '18px', animationDelay: '150ms' }}></div>
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '10px', animationDelay: '300ms' }}></div>
              <div className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '16px', animationDelay: '450ms' }}></div>
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlay}
              className="absolute bottom-3 right-3 flex items-center justify-center w-12 h-12 bg-primary rounded-full shadow-2xl shadow-primary/50 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-primary/90"
            >
              <Play className="w-5 h-5 ml-0.5 text-white" fill="currentColor" />
            </button>
          </div>

          {/* Floating Music Icon Badge */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 opacity-0 group-hover:opacity-100 transition-all duration-300 rotate-12 group-hover:rotate-0">
            <Music2 className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Track Info */}
        <div className="relative space-y-1.5">
          <h3
            className="font-bold text-white truncate text-base group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary/80 group-hover:bg-clip-text transition-all duration-300"
            title={track.name}
          >
            {track.name}
          </h3>
          <p
            className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors duration-300 flex items-center gap-1"
            title={track.artists?.[0]?.name}
          >
            <span className="w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            {track.artists?.[0]?.name || 'Unknown Artist'}
          </p>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
}