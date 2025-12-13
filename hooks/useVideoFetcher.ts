import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { fetchVideosByLanguage, Video } from '../lib/appwrite';

/* =======================
   Storage Keys
======================= */
const CACHE_KEYS = {
  VIDEOS: 'cached_videos',
  TIMESTAMP: 'last_fetch_time',
  LANGUAGE: 'cached_language',
};

/* =======================
   Cache Duration (4 hours in milliseconds)
======================= */
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

/* =======================
   useVideoFetcher Hook
======================= */
export function useVideoFetcher(language: string) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadVideos();
  }, [language]);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading videos for language:', language);
      // Check cache
      const [cachedVideos, cachedTimestamp, cachedLanguage] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.VIDEOS),
        AsyncStorage.getItem(CACHE_KEYS.TIMESTAMP),
        AsyncStorage.getItem(CACHE_KEYS.LANGUAGE),
      ]);

      const now = Date.now();
      const lastFetchTime = cachedTimestamp ? parseInt(cachedTimestamp, 10) : 0;
      const timeSinceLastFetch = now - lastFetchTime;
      const isCacheValid =
        cachedVideos &&
        cachedLanguage === language &&
        timeSinceLastFetch < CACHE_DURATION;

      if (isCacheValid) {
        // Use cached data
        const parsedVideos = JSON.parse(cachedVideos);
        setVideos(parsedVideos);
        setIsLoading(false);
        return;
      }

      // Fetch from Appwrite
      const fetchedVideos = await fetchVideosByLanguage(language);

      // Update cache
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.VIDEOS, JSON.stringify(fetchedVideos)),
        AsyncStorage.setItem(CACHE_KEYS.TIMESTAMP, now.toString()),
        AsyncStorage.setItem(CACHE_KEYS.LANGUAGE, language),
      ]);

      setVideos(fetchedVideos);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to load videos'));

      // Try to use cached data as fallback even if expired
      try {
        const cachedVideos = await AsyncStorage.getItem(CACHE_KEYS.VIDEOS);
        const cachedLanguage = await AsyncStorage.getItem(CACHE_KEYS.LANGUAGE);
        
        if (cachedVideos && cachedLanguage === language) {
          const parsedVideos = JSON.parse(cachedVideos);
          setVideos(parsedVideos);
        }
      } catch (cacheError) {
        console.error('Error loading cached videos:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manually refresh videos (bypasses cache)
   */
  const refreshVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedVideos = await fetchVideosByLanguage(language);

      // Update cache
      const now = Date.now();
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.VIDEOS, JSON.stringify(fetchedVideos)),
        AsyncStorage.setItem(CACHE_KEYS.TIMESTAMP, now.toString()),
        AsyncStorage.setItem(CACHE_KEYS.LANGUAGE, language),
      ]);

      setVideos(fetchedVideos);
    } catch (err) {
      console.error('Error refreshing videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh videos'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear cache
   */
  const clearCache = async () => {
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEYS.VIDEOS),
      AsyncStorage.removeItem(CACHE_KEYS.TIMESTAMP),
      AsyncStorage.removeItem(CACHE_KEYS.LANGUAGE),
    ]);
  };

  return {
    videos,
    isLoading,
    error,
    refreshVideos,
    clearCache,
  };
}

