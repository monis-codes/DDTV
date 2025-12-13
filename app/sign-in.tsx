import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const router = useRouter();
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const { redirectVideoId } = useLocalSearchParams<{ redirectVideoId?: string }>();
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  
  // Logic to mimic 'sm:block' (Tailwind sm is usually 640px)
  const isSmallScreen = width < 640;

  // Animation values
  const bounceAnim1 = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim3 = useRef(new Animated.Value(0)).current;

  // FIXED: Added types for 'anim' and 'delay'
  const startBounce = (anim: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { 
            toValue: -10, 
            duration: 1000, 
            delay: delay, 
            useNativeDriver: true 
        }),
        Animated.timing(anim, { 
            toValue: 0, 
            duration: 1000, 
            useNativeDriver: true 
        })
      ])
    ).start();
  };

  useEffect(() => {
    startBounce(bounceAnim1, 0);
    startBounce(bounceAnim2, 200);
    startBounce(bounceAnim3, 400);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // If there's a redirect video ID, go back to that video
      if (redirectVideoId) {
        router.push(`/video/${redirectVideoId}`);
      } else {
        // Navigation will be handled by NavigationGuard
        router.push("/onboarding");
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      Alert.alert('Sign In Failed', error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      // If there's a redirect video ID, go back to that video
      if (redirectVideoId) {
        router.push(`/video/${redirectVideoId}`);
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Guest login error:", error);
      Alert.alert('Error', 'Failed to enter as guest. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#fde047', '#fbcfe8', '#e9d5ff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        
        {!isSmallScreen && (
          <>
            <View style={[styles.decorativeCircle, styles.circleTopLeft]} />
            <View style={[styles.decorativeCircle, styles.circleBottomRight]} />
            <View style={[styles.decorativeCircle, styles.circleMiddleRight]} />
          </>
        )}

        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Text style={styles.tvIcon}>📺</Text>
            <Text style={styles.title}>DoomDoomTV</Text>
            <Text style={styles.subtitle}>Welcome, little star!</Text>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.getStartedText}>Let's get started!</Text>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[
                styles.button,
                loading && styles.buttonDisabled
              ]}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.buttonText}>
                {loading ? "Signing in..." : "Sign in with Google"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGuestLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[
                styles.button,
                styles.guestButton,
                loading && styles.buttonDisabled
              ]}
            >
              <Text style={[styles.buttonText, styles.guestButtonText]}>
                {loading ? "Loading..." : "Enter as Guest"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Choose how you want to continue
            </Text>
          </View>

          <View style={styles.bottomDecorations}>
            <Animated.Text style={[styles.emoji, { transform: [{ translateY: bounceAnim1 }] }]}>🎨</Animated.Text>
            <Animated.Text style={[styles.emoji, { transform: [{ translateY: bounceAnim2 }] }]}>🎭</Animated.Text>
            <Animated.Text style={[styles.emoji, { transform: [{ translateY: bounceAnim3 }] }]}>🎪</Animated.Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12, 
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circleTopLeft: {
    top: 40,
    left: 40,
    width: 96,
    height: 96,
    backgroundColor: '#fde047', 
    opacity: 0.5,
  },
  circleBottomRight: {
    bottom: 80,
    right: 40,
    width: 128,
    height: 128,
    backgroundColor: '#f9a8d4', 
    opacity: 0.4,
  },
  circleMiddleRight: {
    top: '50%',
    right: 80,
    width: 80,
    height: 80,
    backgroundColor: '#86efac', 
    opacity: 0.5,
  },
  card: {
    width: '100%',
    maxWidth: 384, 
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10, 
    zIndex: 10,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32, 
  },
  tvIcon: {
    fontSize: 48, 
    marginBottom: 12,
  },
  title: {
    fontSize: 30, 
    fontWeight: '900', 
    color: '#333', 
    marginBottom: 8,
    letterSpacing: 1.5, 
  },
  subtitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#666', 
  },
  contentContainer: {
    width: '100%',
    marginBottom: 24,
  },
  getStartedText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000', 
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: '#666', 
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  guestButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 18, 
    fontWeight: '900', 
    color: '#000',
  },
  guestButtonText: {
    color: '#666',
  },
  helperText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888', 
    fontWeight: '600',
    marginTop: 16,
  },
  bottomDecorations: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  emoji: {
    fontSize: 24,
  },
});