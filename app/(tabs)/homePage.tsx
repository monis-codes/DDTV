import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link, useRouter } from "expo-router"
import React, { useEffect, useMemo, useState } from "react"
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ParentalControlModal } from "../../components/parentModal"
import { useAuth } from "../../contexts/AuthContext"
import { useVideoFetcher } from "../../hooks/useVideoFetcher"

/* ────────────────────────────────────────────── */
/* ✅ HOME SCREEN                                  */
/* ────────────────────────────────────────────── */

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [showParent, setShowParent] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en")

  /* ✅ Load preferred language */
  useEffect(() => {
    const loadLanguage = async () => {
      const lang = await AsyncStorage.getItem("language")
      if (lang) {
        setPreferredLanguage(lang)
      } else if (user?.preferredLanguage) {
        setPreferredLanguage(user.preferredLanguage)
      }
    }
    loadLanguage()
  }, [user])

  /* ✅ Fetch videos using the hook */
  const { videos, isLoading, error, refreshVideos } = useVideoFetcher(preferredLanguage)
  const [refreshing, setRefreshing] = useState(false)

  /* ✅ derive categories automatically */
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(videos.map(v => v.title.split(" ")[0] || "Other")))]
  }, [videos])

  /* ✅ search + category filter (LOCAL ONLY) */
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesCategory =
        !selectedCategory || 
        selectedCategory === "All" ||
        video.title.toLowerCase().includes(selectedCategory.toLowerCase())

      const matchesSearch =
        video.title.toLowerCase().includes(query.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [query, selectedCategory, videos])

  /* ✅ Pull to refresh handler */
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshVideos()
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ───── HEADER ───── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🎬 DoomDoomTV</Text>
          <Text style={styles.welcome}>
            Welcome, {user?.name || "Guest"}!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.parentButton}
          onPress={() => setShowParent(true)}
        >
          <Text style={styles.parentButtonText}>Parental Control</Text>
        </TouchableOpacity>
      </View>

      {/* ───── SEARCH BAR ───── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search videos..."
            placeholderTextColor="#C58FB5"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>
      </View>


      {/* ───── CATEGORIES ───── */}
      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive =
              (item === "All" && selectedCategory === null) ||
              item === selectedCategory

            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
                onPress={() =>
                  setSelectedCategory(item === "All" ? null : item)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      </View>

      {/* ───── VIDEO LIST ───── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6FAE" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading videos 😕</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.videoId}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF6FAE"]}
              tintColor="#FF6FAE"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No videos found 😕</Text>
          }
          renderItem={({ item }) => (
            <Link href={`/video/${item.videoId}`} asChild>
              <TouchableOpacity activeOpacity={0.9}>
                <View style={styles.card}>
                  <View>
                    <Image 
                      source={{ uri: item.imageURL }} 
                      style={styles.thumbnail} 
                    />

                    <View style={styles.playOverlay}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.category}>{item.language}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}

      {/* ───── MODALS ───── */}
      <ParentalControlModal
        visible={showParent}
        onClose={() => setShowParent(false)}
      />
    </SafeAreaView>
  )
}

/* ────────────────────────────────────────────── */
/* ✅ STYLES                                      */
/* ────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* ───────── ROOT ───────── */
  container: {
    flex: 1,
    backgroundColor: "#FFF7E5",
  },

  /* ───────── HEADER ───────── */
  header: {
    backgroundColor: "#FF6FAE",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  welcome: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  parentButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  parentButtonText: {
    fontWeight: "900",
    color: "#FF6FAE",
    fontSize: 14,
  },

  /* ───────── SEARCH ───────── */
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE1EF",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#FF8CCF",
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  /* ───────── CATEGORIES ───────── */
  categoryWrapper: {
    flexDirection: "row",
    paddingLeft: 16,
    paddingVertical: 12,
  },

  categoryPill: {
    backgroundColor: "#FFD84D",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
  },

  categoryPillActive: {
    backgroundColor: "#FF6FAE",
  },

  categoryText: {
    fontWeight: "900",
    fontSize: 15,
    color: "#5A4A00",
  },

  categoryTextActive: {
    color: "#fff",
  },

  /* ───────── VIDEO CARD ───────── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
  },

  thumbnail: {
    width: "100%",
    height: 180,
    backgroundColor: "#000",
  },

  playOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  playIcon: {
    fontSize: 48,
    color: "#fff",
  },

  duration: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  durationText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  emoji: {
    fontSize: 34,
  },

  title: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },

  category: {
    fontSize: 14,
    color: "#777",
    fontWeight: "700",
    marginTop: 2,
  },

  /* ───────── EMPTY / NO RESULTS ───────── */
  empty: {
    textAlign: "center",
    fontWeight: "800",
    color: "#999",
    marginTop: 32,
    fontSize: 16,
  },

  /* ───────── LOADING / ERROR ───────── */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ff4444",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
})
