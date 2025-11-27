import { useEffect, useRef, useMemo } from 'react';

// Generate unique session ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get or create session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return null;

  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track event to analytics dashboard
export const trackEvent = async (eventType: string, details?: any) => {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        sessionId,
        details,
        timestamp: new Date().toISOString()
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// Hook untuk tracking page views dan user activity
export const useAnalytics = () => {
  const lastActivityRef = useRef<Date>(new Date());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Track page view only once per page load
    trackEvent('page_view', {
      page: window.location.pathname,
      title: document.title
    });

    // Track visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackEvent('page_focus');
      } else {
        trackEvent('page_blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic activity tracking (every 2 minutes)
    activityTimeoutRef.current = setInterval(() => {
      trackEvent('user_activity');
    }, 120000); // 2 minutes

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, []);

  return {
    trackEvent,
    trackPageView: (page: string) => trackEvent('page_view', { page }),
    trackPlaySong: (songName: string) => trackEvent('play_song', { song: songName }),
    trackSearch: (query: string, results: number) => trackEvent('search_music', { query, results }),
    trackPlaylistGeneration: (prompt: string) => trackEvent('generate_ai_playlist', { prompt }),
    trackSocialClick: (platform: string) => trackEvent('social_click', { platform }),
    trackProfileClick: () => trackEvent('profile_photo_click'),
    trackError: (error: string) => trackEvent('error', { error })
  };
};
