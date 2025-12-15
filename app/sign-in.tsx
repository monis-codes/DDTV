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
  
  const isSmallScreen = width < 640;

  // Animation values
  const bounceAnim1 = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim3 = useRef(new Animated.Value(0)).current;

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
      if (redirectVideoId) {
        router.push(`/video/${redirectVideoId}`);
      } else {
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
            <Text style={styles.getStartedText}>Who is watching?</Text>

            {/* NEW: Side by Side Selection Row */}
            <View style={styles.selectionRow}>
                
                {/* Parent Option -> Google Login */}
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={[
                    styles.selectionCard,
                    styles.parentCard,
                    loading && styles.cardDisabled
                  ]}
                >
                  <Text style={styles.cardEmoji}>👨‍👩‍👧‍👦</Text>
                  <Text style={styles.cardTitle}>I'm a Parent</Text>
                  <Text style={styles.cardSubtitle}>Sign In</Text>
                </TouchableOpacity>

                {/* Kid Option -> Guest Mode */}
                <TouchableOpacity
                  onPress={handleGuestLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={[
                    styles.selectionCard,
                    styles.kidCard,
                    loading && styles.cardDisabled
                  ]}
                >
                  <Text style={styles.cardEmoji}>🎈</Text>
                  <Text style={styles.cardTitle}>I'm a Kid</Text>
                  <Text style={styles.cardSubtitle}>Enter Now</Text>
                </TouchableOpacity>

            </View>

            <Text style={styles.helperText}>
              {loading ? "Loading..." : "Tap your profile to start"}
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
    marginBottom: 24, 
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
    marginBottom: 20,
  },
  // NEW STYLES FOR SIDE-BY-SIDE BOXES
  selectionRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  selectionCard: {
    flex: 1,
    aspectRatio: 0.85, // Makes them rectangular/tall boxes
    borderRadius: 24,
    borderWidth: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  parentCard: {
    backgroundColor: 'white',
    borderColor: '#666',
  },
  kidCard: {
    backgroundColor: '#f0f9ff', // Light blue tint
    borderColor: '#3b82f6', // Blue border
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  // END NEW STYLES
  helperText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888', 
    fontWeight: '600',
    marginTop: 20,
  },
  bottomDecorations: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  emoji: {
    fontSize: 24,
  },
});