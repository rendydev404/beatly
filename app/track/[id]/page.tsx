// app/track/[id]/page.tsx

import { fetchSpotifyAPI } from "@/lib/spotify-final";
import { Track } from "@/types";
import TrackDetailsClient from "@/components/TrackDetailsClient";

// Tipe props untuk Next.js 15 - params adalah Promise
type Props = {
  params: Promise<{ id: string }>
}


// Fungsi untuk ambil detail satu lagu berdasarkan ID
async function getTrackDetails(id: string): Promise<Track | null> {
  try {
    const track = await fetchSpotifyAPI(`v1/tracks/${id}`);
    return track;
  } catch (error) {
    console.error(`Gagal mengambil detail lagu untuk ID: ${id}`, error);
    return null;
  }
}

// `async` Page component TIDAK MASALAH di App Router, asal props benar
export default async function TrackDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const track = await getTrackDetails(resolvedParams.id);

  if (!track) {
    return (
      <main className="bg-zinc-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Lagu Tidak Ditemukan</h1>
        </div>
      </main>
    );
  }

  return <TrackDetailsClient track={track} />;
}
