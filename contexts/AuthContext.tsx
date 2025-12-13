import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { account, COLLECTIONS, DATABASE_ID, databases, ID, Query } from '../lib/appwrite';

// Import Appwrite config
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
      // Get the redirect URL scheme - should match Appwrite console redirect URLs
      // Format: doomdoomtv:// (based on scheme in app.json)
      const redirectUrl = Linking.createURL('/');
      const successUrl = redirectUrl;
      const failureUrl = redirectUrl;

      // For React Native, we need to construct the OAuth URL manually
      // since createOAuth2Session tries to set location.href which doesn't work in RN
      // Construct OAuth URL (Appwrite OAuth endpoint format)
      const oauthUrl = `${ENDPOINT}/account/sessions/oauth2/google?project=${PROJECT_ID}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`;

      // Open OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUrl);

      if (result.type !== 'success') {
        if (result.type === 'cancel') {
          throw new Error('Sign in was cancelled');
        }
        throw new Error('Sign in failed. Please try again.');
      }

      // Parse the callback URL to extract session information
      if (result.url) {
        try {
          // The callback URL will contain the session info
          // Format: doomdoomtv://?secret=xxx&userId=yyy
          const url = new URL(result.url.replace('doomdoomtv://', 'https://temp.com/'));
          const secret = url.searchParams.get('secret');
          const userId = url.searchParams.get('userId');

          if (secret && userId) {
            // Create session using the secret from callback
            await account.createSession(userId, secret);
          } else {
            // If no secret/userId in URL, try to get current session
            // (Appwrite might have set it automatically)
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (urlError) {
          // If URL parsing fails, wait and try to get session
          console.log('URL parsing error, trying to get session:', urlError);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // After OAuth completes, Appwrite SDK should have the session
      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get user data
      try {
        const currentUser = await account.get();
        
        // Store session indicator
        const session = await account.getSession('current');
        if (session) {
          await AsyncStorage.setItem(STORAGE_KEYS.SESSION, session.$id);
        } else {
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
        }
      } catch (error) {
        console.error('Error getting user after OAuth:', error);
        throw new Error('Failed to complete sign in. Please try again.');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
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
    } catch (error) {
      console.error('Guest sign in error:', error);
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

