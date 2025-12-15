import { Account, Client, Databases, ID, Query } from 'appwrite';

/* =======================
   Appwrite Configuration
   NOTE: Replace these with your actual Appwrite project credentials
======================= */
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID';

/* =======================
   Collections
======================= */
export const COLLECTIONS = {
  YT_LINKS: 'yt-links',
  USERS: 'users',
  FAVORITES: 'favorites',
} as const;

/* =======================
   Initialize Appwrite Client
   Note: The standard 'appwrite' package doesn't require setPlatform()
======================= */
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// Export constants for use in other files
export { DATABASE_ID, ID, Query };

/* =======================
   Language Code to Name Mapping
======================= */
const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  'en': 'english',
  'hi': 'hindi',
  'es': 'spanish',
  'ar': 'arabic',
  'fr': 'french',
  'de': 'german',
};

/**
 * Convert language code to full name for database queries
 */
function getLanguageName(languageCode: string): string {
  const normalized = languageCode.toLowerCase();
  return LANGUAGE_CODE_TO_NAME[normalized] || normalized;
}

/**
 * Clean YouTube video ID from various formats
 * Extracts YouTube video ID from:
 * - Direct ID: "rJ-67RIitQs" or "ipmvs_wg6eY"
 * - Full URL: "https://www.youtube.com/watch?v=rJ-67RIitQs"
 * - Short URL: "https://youtu.be/rJ-67RIitQs"
 * - Embed URL: "https://www.youtube.com/embed/rJ-67RIitQs"
 * - Partial URL: "youtube.com/watch?v=rJ-67RIitQs"
 */
function cleanYouTubeId(youtubeId: string | undefined | null): string {
  if (!youtubeId) {
    console.warn('⚠️ Empty YouTube ID provided');
    return '';
  }
  
  // Remove whitespace
  let cleaned = String(youtubeId).trim();
  
  // If it's a full URL or partial URL, extract the ID
  if (cleaned.includes('youtube.com/watch?v=') || cleaned.includes('watch?v=')) {
    const match = cleaned.match(/[?&]v=([^&]+)/);
    if (match && match[1]) {
      return match[1].split('?')[0].split('#')[0].trim();
    }
  }
  
  if (cleaned.includes('youtu.be/')) {
    const match = cleaned.match(/youtu\.be\/([^?&]+)/);
    if (match && match[1]) {
      return match[1].split('?')[0].split('#')[0].trim();
    }
  }
  
  if (cleaned.includes('youtube.com/embed/') || cleaned.includes('/embed/')) {
    const match = cleaned.match(/embed\/([^?&]+)/);
    if (match && match[1]) {
      return match[1].split('?')[0].split('#')[0].trim();
    }
  }
  
  // If it's already just an ID (like "rJ-67RIitQs" or "ipmvs_wg6eY"), return as is
  // Remove any query parameters, fragments, or trailing slashes
  cleaned = cleaned.split('?')[0].split('#')[0].replace(/\/$/, '').trim();
  
  // Return cleaned ID - YouTube IDs can contain alphanumeric, hyphens, underscores, and dots
  // Be permissive - just return what we have if it's not empty
  if (cleaned.length > 0) {
    return cleaned;
  }
  
  console.warn('⚠️ Could not extract YouTube ID from:', youtubeId);
  return '';
}

/* =======================
   Video Service Functions
======================= */

export interface Video {
  videoId: string; // This is the document $id (used for routing and favorites)
  title: string;
  imageURL: string;
  language: string;
  youtubeId: string; // The actual YouTube video ID (e.g., "Rc4967cMQIA")
}

/**
 * Fetch videos from Appwrite filtered by language
 */
export async function fetchVideosByLanguage(language: string): Promise<Video[]> {
  try {
    // Convert language code (e.g., "en") to full name (e.g., "english") for database query
    const languageQuery = getLanguageName(language);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.YT_LINKS,
      [Query.equal('language', languageQuery)]
    );

    return response.documents.map((doc: any) => {
      // The database attribute for YouTube video ID is 'videoId'
      // Note: doc.$id is the Appwrite document ID, doc.videoId is the YouTube video ID attribute
      const youtubeIdRaw = doc.videoId || ''; // Use videoId as the primary field name
      
      console.log('📹 Video from DB:', {
        documentId: doc.$id,
        title: doc.title,
        youtubeVideoIdAttribute: doc.videoId, // This is the YouTube video ID from database attribute
        allFields: Object.keys(doc)
      });
      
      const cleanedId = cleanYouTubeId(youtubeIdRaw);
      console.log('📹 Video cleaned:', {
        title: doc.title,
        original: youtubeIdRaw,
        cleaned: cleanedId
      });
      
      if (!cleanedId) {
        console.warn('⚠️ Warning: Empty YouTube ID for video:', doc.title, 'Raw value:', youtubeIdRaw);
      }
      
      return {
        videoId: doc.$id, // Appwrite document ID (used for routing)
        title: doc.title || '',
        imageURL: doc.imageURL || doc.image_url || '',
        language: doc.language || '',
        youtubeId: cleanedId, // The YouTube video ID for playback (cleaned from doc.videoId)
      };
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}

/* =======================
   Favorites Service Functions
======================= */

/**
 * Add a video to favorites (for logged-in users only)
 */
export async function addToFavorites(userId: string, videoId: string): Promise<void> {
  try {
    // Check if already favorited
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FAVORITES,
      [
        Query.equal('userId', userId),
        Query.equal('videoId', videoId),
      ]
    );

    if (existing.documents.length === 0) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FAVORITES,
        ID.unique(),
        {
          userId,
          videoId,
        }
      );
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

/**
 * Remove a video from favorites
 */
export async function removeFromFavorites(userId: string, videoId: string): Promise<void> {
  try {
    const favorites = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FAVORITES,
      [
        Query.equal('userId', userId),
        Query.equal('videoId', videoId),
      ]
    );

    if (favorites.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.FAVORITES,
        favorites.documents[0].$id
      );
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

/**
 * Check if a video is favorited
 */
export async function isVideoFavorited(userId: string, videoId: string): Promise<boolean> {
  try {
    const favorites = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FAVORITES,
      [
        Query.equal('userId', userId),
        Query.equal('videoId', videoId),
      ]
    );

    return favorites.documents.length > 0;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Get all favorite video IDs for a user
 */
export async function getUserFavorites(userId: string): Promise<string[]> {
  try {
    const favorites = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FAVORITES,
      [Query.equal('userId', userId)]
    );

    return favorites.documents.map((doc: any) => doc.videoId);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return [];
  }
}

