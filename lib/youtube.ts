// lib/youtube.ts

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

// Fungsi utama untuk mencari lagu di YouTube
export async function searchYouTubeForSong(
  songTitle: string,
  artistName: string
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YouTube API key not found");
    return null;
  }

  // Clean up song title and artist name
  songTitle = songTitle.replace(/\([^)]*\)/g, '').trim(); // Remove text in parentheses
  songTitle = songTitle.split('-')[0].trim(); // Take only the first part if there's a dash
  artistName = artistName.split(',')[0].trim(); // Take only the first artist if multiple

  // Prioritized search queries
  const searchQueries = [
    `${songTitle} ${artistName} official audio`,
    `${songTitle} ${artistName} lyrics`,
    `${songTitle} ${artistName}`,
    `${songTitle} audio`,
  ];

  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&q=${encodeURIComponent(query)}` +
        `&type=video&videoCategoryId=10` + // Music category
        `&maxResults=3&key=${apiKey}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`YouTube API error for "${query}":`, errorText);
        
        if (response.status === 403) {
          throw new Error('YouTube API quota exceeded');
        }
        continue;
      }

      const data: YouTubeSearchResponse = await response.json();

      if (data.items && data.items.length > 0) {
        // Try to find the best match
        const bestMatch = data.items.find(item => {
          const title = item.snippet.title.toLowerCase();
          return (
            title.includes(songTitle.toLowerCase()) &&
            title.includes(artistName.toLowerCase()) &&
            !title.includes('cover') &&
            !title.includes('remix')
          );
        }) || data.items[0]; // Fallback to first result if no perfect match

        console.log(`Found video for "${query}": ${bestMatch.id.videoId}`);
        return bestMatch.id.videoId;
      }
    } catch (error) {
      console.error(`Failed to search YouTube for "${query}":`, error);
      if (error instanceof Error && error.message === 'YouTube API quota exceeded') {
        throw error; // Re-throw quota error to handle it in the player
      }
    }
  }

  console.warn(`No videos found for "${songTitle} - ${artistName}"`);
  return null;
}