// components/TrackCard.tsx
import { Track } from "@/types";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface TrackCardProps {
  track: Track;
  onPlay: () => void;
}

export default function TrackCard({ track, onPlay }: TrackCardProps) {
  const router = useRouter();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking play button
    onPlay();
  };

  const handleCardClick = () => {
    router.push(`/track/${track.id}`);
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative mb-4">
        <img
          src={track.album?.images?.[0]?.url || '/spotify-logo.png'}
          alt={track.name}
          className="w-full aspect-square object-cover rounded-md"
        />
        {/* Spotify-style play button overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center rounded-md">
          <button
            onClick={handlePlay}
            className="bg-primary hover:bg-primary/90 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-white truncate group-hover:text-white transition-colors" title={track.name}>
          {track.name}
        </h3>
        <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors" title={track.artists?.[0]?.name}>
          {track.artists?.[0]?.name || 'Unknown Artist'}
        </p>
      </div>
    </div>
  );
}