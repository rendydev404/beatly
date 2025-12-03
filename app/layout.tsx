// app/layout.tsx
"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { PlayerProvider } from "@/app/context/PlayerContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import SplashScreen from "@/components/SplashScreen";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AIPlaylistGenerator from "@/components/AIPlaylistGenerator"; // Impor komponen AI
import DevInfo from "@/components/DevInfo"; // Impor komponen DevInfo
import GoogleAnalytics from "@/components/GoogleAnalytics"; // Impor Google Analytics// Impor komponen GeminiDebug
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    // ... (logika untuk memuat tema tetap sama)
  }, []);

  return (
    <html lang="id">
      <head>
        {/* Google Analytics Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-L0V33E1LY5`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L0V33E1LY5', {
              page_title: document.title,
              page_location: window.location.href,
              debug_mode: true
            });
            
            // Custom events for better tracking
            window.addEventListener('load', function() {
              gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href
              });
            });
          `}
        </Script>

        {/* Primary Meta Tags */}
        <title>Spotify Clone - Musik Streaming Gratis Terbaik 2025 | Spotify Clone Indonesia</title>
        <meta name="title" content="Spotify Clone - Musik Streaming Gratis Terbaik 2025 | Spotify Clone Indonesia" />
        <meta name="description" content="Spotify Clone Indonesia - Platform musik streaming gratis terbaik 2025. Dengarkan lagu-lagu hits dari Taylor Swift, James Arthur, Yovie & Nuno, Tulus dan artis favorit lainnya. Fitur AI playlist generator, search musik, dan player musik gratis." />
        <meta name="keywords" content="spotify clone, musik streaming, musik gratis, lagu hits, taylor swift, james arthur, yovie nuno, tulus, ai playlist, player musik, search musik, streaming musik indonesia" />
        <meta name="author" content="Rendy Dev" />
        <meta name="robots" content="index, follow" />
        <meta name="google-site-verification" content="r9BfynTm4wA2LB4QHhi5RqqCnDslr9GBZFTGTko-c1s" />
        <meta name="language" content="Indonesian" />
        <meta name="revisit-after" content="7 days" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spotify-clone-by-rendydev.vercel.app/" />
        <meta property="og:title" content="Spotify Clone - Musik Streaming Gratis Terbaik 2025" />
        <meta property="og:description" content="Platform musik streaming gratis terbaik 2025. Dengarkan lagu-lagu hits dari Taylor Swift, James Arthur, Yovie & Nuno, Tulus dan artis favorit lainnya." />
        <meta property="og:image" content="https://spotify-clone-by-rendydev.vercel.app/spotify-logo.png" />
        <meta property="og:site_name" content="Spotify Clone Indonesia" />
        <meta property="og:locale" content="id_ID" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://spotify-clone-by-rendydev.vercel.app/" />
        <meta property="twitter:title" content="Spotify Clone - Musik Streaming Gratis Terbaik 2025" />
        <meta property="twitter:description" content="Platform musik streaming gratis terbaik 2025. Dengarkan lagu-lagu hits dari Taylor Swift, James Arthur, Yovie & Nuno, Tulus dan artis favorit lainnya." />
        <meta property="twitter:image" content="https://spotify-clone-by-rendydev.vercel.app/spotify-logo.png" />

        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#1DB954" />
        <meta name="msapplication-TileColor" content="#1DB954" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Spotify Clone" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://spotify-clone-by-rendydev.vercel.app/" />

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/spotify-logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/spotify-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/spotify-logo.png" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Structured Data for Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Spotify Clone Indonesia",
              "description": "Platform musik streaming gratis terbaik 2025 dengan fitur AI playlist generator",
              "url": "https://spotify-clone-by-rendydev.vercel.app/",
              "applicationCategory": "MusicApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "IDR"
              },
              "author": {
                "@type": "Person",
                "name": "Rendy Dev"
              },
              "creator": {
                "@type": "Person",
                "name": "Rendy Dev"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Spotify Clone Indonesia"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250"
              },
              "featureList": [
                "Musik Streaming Gratis",
                "AI Playlist Generator",
                "Search Musik",
                "Player Musik",
                "Lagu Hits Indonesia"
              ]
            })
          }}
        />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Spotify Clone Indonesia",
              "url": "https://spotify-clone-by-rendydev.vercel.app/",
              "logo": "https://spotify-clone-by-rendydev.vercel.app/spotify-logo.png",
              "sameAs": [
                "https://github.com/rendydev404/spotify-clone"
              ]
            })
          }}
        />

        {/* Music Album Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicAlbum",
              "name": "Lagu Hits Indonesia",
              "description": "Koleksi lagu hits dari Taylor Swift, James Arthur, Yovie & Nuno, Tulus",
              "byArtist": {
                "@type": "MusicGroup",
                "name": "Various Artists"
              },
              "genre": "Pop, Rock, R&B",
              "albumReleaseType": "AlbumRelease"
            })
          }}
        />
      </head>
      <body className="bg-background text-text-primary">
        {showSplash ? (
          <SplashScreen onFinished={() => setShowSplash(false)} />
        ) : (
          <PlayerProvider>
            <div className="flex h-full">
              {!isAdmin && <Sidebar />}
              <main className={`flex-1 overflow-y-auto pb-32 md:pb-24 ${!isAdmin ? 'md:ml-[250px]' : ''}`}>
                {children}
              </main>
            </div>
            <AIPlaylistGenerator /> {/* Letakkan komponen di sini */}
            <GlobalPlayer />
            <DevInfo /> {/* Developer Info dengan floating icon */}
            <GoogleAnalytics /> {/* Google Analytics tracking */}
          </PlayerProvider>
        )}
      </body>
    </html>
  );
}