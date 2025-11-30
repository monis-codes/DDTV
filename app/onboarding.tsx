import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* =======================
   Types
======================= */
interface Language {
  code: string;
  name: string;
  flag: string;
}

/* =======================
   Data
======================= */
const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export default function LanguagePage() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [nameInput, setNameInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  const isSmallScreen = width < 640;

  /* =======================
     Animations
  ======================= */
  const bounce1 = useRef(new Animated.Value(0)).current;
  const bounce2 = useRef(new Animated.Value(0)).current;
  const bounce3 = useRef(new Animated.Value(0)).current;

  const startBounce = (anim: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -10,
          duration: 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startBounce(bounce1, 0);
    startBounce(bounce2, 200);
    startBounce(bounce3, 400);
  }, []);

  /* =======================
     Load Stored Name
  ======================= */
  useEffect(() => {
    const loadName = async () => {
      const storedName = await AsyncStorage.getItem('childName');
      if (storedName) setNameInput(storedName);
    };
    loadName();
  }, []);

  /* =======================
     Actions
  ======================= */
  const handleContinue = async () => {
    if (!nameInput.trim()) return;

    setLoading(true);
    await AsyncStorage.setItem('childName', nameInput.trim());
    await AsyncStorage.setItem('language', selectedLanguage);

    setTimeout(() => {
      router.push('/homePage');
      setLoading(false);
    }, 500);
  };

  /* =======================
     UI
  ======================= */
  return (
    <LinearGradient colors={['#E0C3FC', '#F3E8FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                {/* ===== Header ===== */}
                <View style={styles.header}>
                  <Text style={styles.globe}>🌍</Text>
                  <Text style={styles.title}>Pick Your Language!</Text>
                  <Text style={styles.greeting}>
                    Hi there 👋 What language do you want today?
                  </Text>
                </View>

                {/* ===== Name Input ===== */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>What’s your name? 😊</Text>
                  <TextInput
                    value={nameInput}
                    onChangeText={setNameInput}
                    placeholder="Enter your name"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                </View>

                {/* ===== Language Grid ===== */}
                <View style={styles.grid}>
                  {languages.map((lang) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        activeOpacity={0.85}
                        onPress={() => setSelectedLanguage(lang.code)}
                        style={[
                          styles.gridItem,
                          isSmallScreen
                            ? styles.gridItemMobile
                            : styles.gridItemTablet,
                          isSelected
                            ? styles.gridItemSelected
                            : styles.gridItemUnselected,
                        ]}
                      >
                        <Text style={styles.flag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.langName,
                            isSelected && styles.langSelected,
                          ]}
                        >
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ===== Bottom Section ===== */}
                <View style={styles.bottom}>
                  <View style={styles.emojis}>
                    <Animated.Text
                      style={[
                        styles.emoji,
                        { transform: [{ translateY: bounce1 }] },
                      ]}
                    >
                      🎵
                    </Animated.Text>
                    <Animated.Text
                      style={[
                        styles.emoji,
                        { transform: [{ translateY: bounce2 }] },
                      ]}
                    >
                      🎨
                    </Animated.Text>
                    <Animated.Text
                      style={[
                        styles.emoji,
                        { transform: [{ translateY: bounce3 }] },
                      ]}
                    >
                      🎭
                    </Animated.Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleContinue}
                    disabled={loading}
                    activeOpacity={0.9}
                    style={[
                      styles.continueButton,
                      loading && styles.disabled,
                    ]}
                  >
                    <Text style={styles.continueText}>
                      {loading ? 'Loading…' : "Let’s Watch Videos!"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* =======================
   Styles
======================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  globe: { fontSize: 48 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ec4899',
    marginTop: 8,
  },
  greeting: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#f59e0b',
  },

  inputContainer: { marginBottom: 24 },
  inputLabel: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    color: '#111827',
  },
  input: {
    backgroundColor: '#fffbeb',
    borderWidth: 4,
    borderColor: '#ff8fab',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },

  gridItem: {
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  gridItemMobile: { width: '47%' },
  gridItemTablet: { width: '30%' },

  gridItemUnselected: {
    backgroundColor: '#fffbeb',
    borderWidth: 4,
    borderColor: '#fde047',
  },
  gridItemSelected: {
    backgroundColor: '#ff69b4',
    borderWidth: 4,
    borderColor: '#ff69b4',
  },

  flag: { fontSize: 40, marginBottom: 8 },
  langName: { fontSize: 16, fontWeight: '900', color: '#111827' },
  langSelected: { color: '#ffffff' },

  bottom: { alignItems: 'center', gap: 16 },
  emojis: { flexDirection: 'row', gap: 16 },
  emoji: { fontSize: 24 },

  continueButton: {
    width: '100%',
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  disabled: { opacity: 0.7 },
});
