import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { account, COLLECTIONS, DATABASE_ID, databases, ID, Query } from '../lib/appwrite';

// Import Appwrite config - use same values as appwrite.ts
// Make sure EXPO_PUBLIC_APPWRITE_ENDPOINT is set to match your Appwrite instance
// For Singapore region: https://sgp.cloud.appwrite.io/v1
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';

// Complete OAuth session when browser closes
WebBrowser.maybeCompleteAuthSession();

/* =======================
   Types
======================= */
export interface User {
  $id: string;
  name: string;
  preferredLanguage: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (name: string, preferredLanguage: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =======================
   Storage Keys
======================= */
const STORAGE_KEYS = {
  SESSION: 'appwrite_session',
  GUEST_MODE: 'guest_mode',
  USER_DATA: 'user_data',
};

/* =======================
   AuthProvider Component
======================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* =======================
     Initialize Auth State
  ======================= */
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check for guest mode
      const guestMode = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_MODE);
      if (guestMode === 'true') {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (userData) {
          setUser(JSON.parse(userData));
          setIsGuest(true);
          setIsLoading(false);
          return;
        }
      }

      // Check for Appwrite session
      const session = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) {
        try {
          // Validate session by getting current user
          const currentUser = await account.get();
          
          // Try to fetch user profile from users collection
          try {
            const userDocs = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.USERS,
              [Query.equal('userId', currentUser.$id)]
            );

            if (userDocs.documents.length > 0) {
              const userDoc = userDocs.documents[0];
              const userData: User = {
                $id: currentUser.$id,
                name: userDoc.name,
                preferredLanguage: userDoc.preferredLanguage,
                email: currentUser.email,
              };
              setUser(userData);
              setIsGuest(false);
              await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            } else {
              // User exists but no profile - create one with defaults
              const userData: User = {
                $id: currentUser.$id,
                name: currentUser.name || 'User',
                preferredLanguage: 'en',
                email: currentUser.email,
              };
              setUser(userData);
              setIsGuest(false);
            }
          } catch (error) {
            // If collection doesn't exist or error, use account data
            const userData: User = {
              $id: currentUser.$id,
              name: currentUser.name || 'User',
              preferredLanguage: 'en',
              email: currentUser.email,
            };
            setUser(userData);
            setIsGuest(false);
          }
        } catch (error) {
          // Session invalid, clear it
          await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
     Sign In With Google (OAuth)
  ======================= */
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google OAuth sign in...');
      
      // Validate Appwrite configuration
      if (PROJECT_ID === 'YOUR_PROJECT_ID' || !PROJECT_ID) {
        console.error('❌ Appwrite PROJECT_ID not configured!');
        throw new Error('Appwrite project ID is not configured. Please set EXPO_PUBLIC_APPWRITE_PROJECT_ID in your environment variables.');
      }
      
      if (ENDPOINT === 'https://cloud.appwrite.io/v1' && !process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) {
        console.warn('⚠️ Using default Appwrite endpoint. Make sure this matches your Appwrite instance.');
      }
      
      // Get the redirect URL scheme - should match Appwrite console redirect URLs
      // Format: doomdoomtv:// (based on scheme in app.json)
      const redirectUrl = Linking.createURL('/');
      const successUrl = redirectUrl;
      const failureUrl = redirectUrl;

      console.log('📱 Redirect URL:', redirectUrl);
      console.log('🔧 Appwrite Endpoint:', ENDPOINT);
      console.log('🔧 Appwrite Project ID:', PROJECT_ID.substring(0, 8) + '...');

      // For React Native, we need to construct the OAuth URL manually
      // since createOAuth2Session tries to set location.href which doesn't work in RN
      // Construct OAuth URL (Appwrite OAuth endpoint format)
      const oauthUrl = `${ENDPOINT}/account/sessions/oauth2/google?project=${PROJECT_ID}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`;

      console.log('🌐 Opening OAuth URL in browser...');

      // Open OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUrl);

      if (result.type !== 'success') {
        if (result.type === 'cancel') {
          console.log('❌ User cancelled OAuth sign in');
          throw new Error('Sign in was cancelled');
        }
        console.error('❌ OAuth failed with type:', result.type);
        throw new Error('Sign in failed. Please try again.');
      }

      console.log('✅ OAuth callback received');
      console.log('📋 Full callback URL:', result.url);

      // Parse the callback URL to extract session information
      if (result.url) {
        try {
          // The callback URL format from Appwrite: doomdoomtv://?secret=xxx&userId=yyy
          // We need to parse this properly
          let parsedUrl: URL;
          
          // Handle the custom scheme by replacing it with http:// for URL parsing
          const urlString = result.url;
          console.log('🔍 Parsing URL:', urlString);
          
          // Extract the scheme from redirectUrl (e.g., "doomdoomtv://" or "doomdoomtv:///")
          const schemeMatch = redirectUrl.match(/^([^:]+):\/\/?/);
          const scheme = schemeMatch ? schemeMatch[1] : 'doomdoomtv';
          
          if (urlString.startsWith(`${scheme}://`) || urlString.startsWith(`${scheme}:///`)) {
            // Replace custom scheme with http:// for URL parsing
            // Handle both "doomdoomtv://" and "doomdoomtv:///" formats
            const httpUrl = urlString.replace(new RegExp(`^${scheme}:///?`), 'http://temp.com/');
            parsedUrl = new URL(httpUrl);
          } else if (urlString.includes('://')) {
            parsedUrl = new URL(urlString);
          } else {
            // If no scheme, try to parse as relative URL
            parsedUrl = new URL(urlString, 'http://temp.com/');
          }
          
          // Log all query parameters for debugging
          console.log('📊 All query parameters:', Object.fromEntries(parsedUrl.searchParams.entries()));
          
          const secret = parsedUrl.searchParams.get('secret');
          const userId = parsedUrl.searchParams.get('userId');
          
          // Also check for alternative parameter names
          const altSecret = parsedUrl.searchParams.get('session') || parsedUrl.searchParams.get('token');
          const altUserId = parsedUrl.searchParams.get('user_id') || parsedUrl.searchParams.get('uid');

          console.log('🔑 Extracted from callback:');
          console.log('  - userId:', userId || altUserId || 'missing');
          console.log('  - secret:', secret || altSecret ? 'present' : 'missing');

          // Use the found values (prefer standard names, fallback to alternatives)
          const finalSecret = secret || altSecret;
          const finalUserId = userId || altUserId;

          if (finalSecret && finalUserId) {
            // Create session using the secret from callback
            console.log('🔐 Creating Appwrite session with userId:', finalUserId);
            try {
              const session = await account.createSession(finalUserId, finalSecret);
              console.log('✅ Session created successfully:', session.$id);
              
              // Verify session is active by checking if we can get the user
              // Wait a bit for session to propagate
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (sessionError: any) {
              console.error('❌ Failed to create session:', sessionError);
              console.error('❌ Session error details:', JSON.stringify(sessionError, null, 2));
              throw new Error('Failed to create session. Please try again.');
            }
          } else {
            // If no secret/userId in URL, wait and try to get current session
            // (Appwrite might have set it automatically via cookies in web browser)
            console.log('⚠️ No secret/userId in URL, waiting for session...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try to verify if session exists
            try {
              const testSession = await account.getSession('current');
              if (testSession) {
                console.log('✅ Found existing session:', testSession.$id);
              } else {
                throw new Error('No session found in callback URL and no existing session');
              }
            } catch (sessionCheckError) {
              console.error('❌ No valid session found:', sessionCheckError);
              throw new Error('Failed to establish session. Please try signing in again.');
            }
          }
        } catch (urlError) {
          // If URL parsing fails, wait and try to get session
          console.error('⚠️ URL parsing error:', urlError);
          console.log('⏳ Waiting and trying to get session...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // After OAuth completes, verify session is established
      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get user data
      try {
        console.log('👤 Fetching user account...');
        const currentUser = await account.get();
        console.log('✅ User account retrieved:', currentUser.email || currentUser.name);
        
        // Store session indicator
        const session = await account.getSession('current');
        if (session) {
          await AsyncStorage.setItem(STORAGE_KEYS.SESSION, session.$id);
          console.log('💾 Session stored:', session.$id);
        } else {
          console.warn('⚠️ No session found, storing OAuth indicator');
          await AsyncStorage.setItem(STORAGE_KEYS.SESSION, 'oauth_session');
        }
        await AsyncStorage.removeItem(STORAGE_KEYS.GUEST_MODE);

        // Try to fetch user profile
        try {
          const userDocs = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.equal('userId', currentUser.$id)]
          );

          if (userDocs.documents.length > 0) {
            const userDoc = userDocs.documents[0];
            const userData: User = {
              $id: currentUser.$id,
              name: userDoc.name,
              preferredLanguage: userDoc.preferredLanguage,
              email: currentUser.email,
            };
            setUser(userData);
            setIsGuest(false);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            console.log('✅ User logged in successfully:', userData.name, userData.email);
          } else {
            // No profile yet, will be created in onboarding
            const userData: User = {
              $id: currentUser.$id,
              name: currentUser.name || 'User',
              preferredLanguage: 'en',
              email: currentUser.email,
            };
            setUser(userData);
            setIsGuest(false);
            console.log('✅ User logged in successfully (new user):', userData.name, userData.email);
          }
        } catch (error) {
          // Collection might not exist yet
          const userData: User = {
            $id: currentUser.$id,
            name: currentUser.name || 'User',
            preferredLanguage: 'en',
            email: currentUser.email,
          };
          setUser(userData);
          setIsGuest(false);
          console.log('✅ User logged in successfully (fallback):', userData.name, userData.email);
        }
      } catch (error: any) {
        console.error('❌ Error getting user after OAuth:', error);
        // Check if it's a scope/permission error
        if (error.message && error.message.includes('missing scopes')) {
          console.error('🔒 Permission error - session may not be properly established');
          throw new Error('Session not properly established. Please try signing in again.');
        }
        throw new Error('Failed to complete sign in. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      // If user cancelled, don't throw error
      if (error.message && error.message.includes('cancel')) {
        throw new Error('Sign in was cancelled');
      }
      throw error;
    }
  };

  /* =======================
     Sign In As Guest
  ======================= */
  const signInAsGuest = async () => {
    try {
      console.log('👤 Signing in as guest...');
      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true');
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
      
      const guestUser: User = {
        $id: `guest_${Date.now()}`,
        name: 'Guest',
        preferredLanguage: 'en',
      };
      
      setUser(guestUser);
      setIsGuest(true);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(guestUser));
      console.log('✅ Guest user logged in successfully:', guestUser.$id);
    } catch (error) {
      console.error('❌ Guest sign in error:', error);
      throw error;
    }
  };

  /* =======================
     Sign Out
  ======================= */
  const signOut = async () => {
    try {
      if (!isGuest) {
        await account.deleteSession('current');
      }
      
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION,
        STORAGE_KEYS.GUEST_MODE,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear local state even if remote sign out fails
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION,
        STORAGE_KEYS.GUEST_MODE,
        STORAGE_KEYS.USER_DATA,
      ]);
      setUser(null);
      setIsGuest(false);
    }
  };

  /* =======================
     Update User Profile
  ======================= */
  const updateUserProfile = async (name: string, preferredLanguage: string) => {
    try {
      const updatedUser: User = {
        ...user!,
        name,
        preferredLanguage,
      };

      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      // If logged in (not guest), save to Appwrite
      if (!isGuest && user) {
        try {
          // Check if user document exists
          const userDocs = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.equal('userId', user.$id)]
          );

          if (userDocs.documents.length > 0) {
            // Update existing document
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              userDocs.documents[0].$id,
              {
                name,
                preferredLanguage,
              }
            );
          } else {
            // Create new document
            await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              ID.unique(),
              {
                userId: user.$id,
                name,
                preferredLanguage,
              }
            );
          }
        } catch (error) {
          console.error('Error saving to Appwrite:', error);
          // Continue even if Appwrite save fails
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isLoading,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =======================
   useAuth Hook
======================= */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

