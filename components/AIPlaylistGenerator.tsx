"use client";

import { useState } from "react";
import { useAnalytics } from '@/hooks/useAnalytics';
import { Sparkles, X, LoaderCircle } from "lucide-react";
import { Track } from "@/types";
import { usePlayer } from "@/app/context/PlayerContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AIPlaylistGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { playSong, activeTrack } = usePlayer();
  const router = useRouter();
  const { trackEvent, trackPlaylistGeneration, trackError } = useAnalytics();

  const handleGeneratePlaylist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) {
      setError("Mohon masukkan deskripsi playlist yang diinginkan");
      return;
    }

    setIsLoading(true);
    setError("");
    
    console.log("Memulai generate playlist dengan prompt:", trimmedPrompt);

    try {
      // Generate search query using Gemini
      console.log("Calling Gemini API...");
      const geminiResponse = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      if (!geminiResponse.ok) {
        let errorData;
        try {
          errorData = await geminiResponse.json();
        } catch (e) {
          console.error('Error parsing response:', e);
          errorData = { error: 'Failed to parse response' };
        }
        console.error('Gemini API error:', errorData);
        throw new Error(errorData.error || "Gagal mendapatkan respons dari AI.");
      }

      const geminiData = await geminiResponse.json();
      if (!geminiData.query) {
        throw new Error("AI tidak menghasilkan query yang valid.");
      }

      // Search tracks using the generated query
      const searchQuery = geminiData.query.trim().replace(/["']/g, "");
      console.log("Generated search query:", searchQuery);

      console.log("Calling Spotify API...");
      const spotifyResponse = await fetch(`/api/spotify?type=search&q=${encodeURIComponent(searchQuery)}`);
      
      if (!spotifyResponse.ok) {
        const errorData = await spotifyResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Spotify API error:', errorData);
        throw new Error(errorData.error || "Gagal mencari lagu di Spotify.");
      }
      
      const spotifyData = await spotifyResponse.json();
      const tracks: Track[] = spotifyData?.tracks?.items || [];
      
      if (!tracks.length) {
        throw new Error("Tidak ada lagu yang cocok dengan kriteria tersebut.");
      }

      console.log(`Found ${tracks.length} tracks`);

      const newPlaylistName = `AI Playlist: ${trimmedPrompt}`;
      localStorage.setItem('my-playlist-name', newPlaylistName);
      localStorage.setItem('my-playlist', JSON.stringify(tracks));
      
      playSong(tracks[0], tracks, 0);
      router.push('/playlist');
      setIsOpen(false);
      trackPlaylistGeneration(trimmedPrompt);

    } catch (err) {
      console.error('Error detail:', err);
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.";
      setError(errorMessage);
      trackError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed right-4 md:right-8 z-[45] transition-all duration-300 ease-in-out
        ${activeTrack 
          ? 'bottom-[10rem] md:bottom-24'
          : 'bottom-20 md:bottom-8'
        }`
      }>
        <motion.button 
          onClick={() => {
            setIsOpen(true);
            trackEvent('ai_playlist_button_click', { location: 'floating_button' });
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-white rounded-full p-4 shadow-lg"
          aria-label="Buat Playlist AI"
        >
          <Sparkles size={28} />
        </motion.button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 w-full max-w-md relative text-white shadow-2xl"
            >
              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Sparkles className="text-primary" size={24}/>
                </div>
                <h2 className="text-xl font-bold">AI Playlist Generator (BETA)</h2>
              </div>
              <div className="space-y-2 mb-5">
                <p className="text-sm text-zinc-400">
                  Jelaskan dengan detail lagu yang kamu inginkan. Semakin spesifik, semakin baik hasilnya.
                </p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>✨ Tips mendapatkan hasil terbaik:</p>
                  <p>• Sebutkan genre: "lagu pop indonesia 2023"</p>
                  <p>• Sebutkan artis: "lagu mirip Tulus yang romantis"</p>
                  <p>• Sebutkan mood: "lagu semangat untuk workout"</p>
                </div>
              </div>
              <form onSubmit={handleGeneratePlaylist}>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: lagu pop indonesia yang lagi hits..."
                  className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-lg py-3 px-4 border-2 border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  rows={3}
                />
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                <motion.button
                  type="submit"
                  disabled={isLoading || !prompt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary text-white font-bold rounded-lg py-3 px-4 mt-4 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {isLoading ? <LoaderCircle className="animate-spin" /> : "Buat Playlist"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}