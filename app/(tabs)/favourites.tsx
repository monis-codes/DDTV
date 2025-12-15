import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link, useFocusEffect } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAuth } from "../../contexts/AuthContext"
import { fetchVideosByLanguage, getUserFavorites, Video } from "../../lib/appwrite"

const FAV_KEY = "FAVOURITE_VIDEOS"

export default function FavouritesScreen() {
  const { user, isGuest } = useAuth()
  const [favourites, setFavourites] = useState<string[]>([])
  const [favVideos, setFavVideos] = useState<Video[]>([])
  const [childName, setChildName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChildName()
  }, [user])

  // Refresh favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavourites()
    }, [user, isGuest])
  )

  const loadChildName = async () => {
    const name = await AsyncStorage.getItem("childName")
    if (name) {
      setChildName(name)
    } else if (user?.name) {
      setChildName(user.name)
    } else {
      setChildName("Guest")
    }
  }

  const loadFavourites = async () => {
    try {
      setIsLoading(true)
      let favoriteIds: string[] = []

      if (isGuest) {
        // For guests, get from AsyncStorage
        const raw = await AsyncStorage.getItem(FAV_KEY)
        favoriteIds = raw ? JSON.parse(raw) : []
      } else if (user) {
        // For logged-in users, get from Appwrite
        try {
          favoriteIds = await getUserFavorites(user.$id)
        } catch (error) {
          console.error("Error fetching favorites from Appwrite:", error)
          // Fallback to local storage
          const raw = await AsyncStorage.getItem(FAV_KEY)
          favoriteIds = raw ? JSON.parse(raw) : []
        }
      }

      setFavourites(favoriteIds)

      // Fetch all videos to match with favorites
      const lang = await AsyncStorage.getItem("language") || "en"
      const allVideos = await fetchVideosByLanguage(lang)
      
      // Filter videos that are in favorites
      const favoriteVideos = allVideos.filter((v) =>
        favoriteIds.includes(v.videoId)
      )

      setFavVideos(favoriteVideos)
    } catch (error) {
      console.error("Error loading favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>❤️ Favourites</Text>
        <Text style={styles.subtitle}>
          Videos {childName} loves watching
        </Text>
      </View>

      {/* LOADING STATE */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6FAE" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : favVideos.length === 0 ? (
        /* EMPTY STATE */
        <Text style={styles.empty}>
          No favourite videos yet 💖{"\n"}
          Tap ❤️ on a video to save it!
        </Text>
      ) : (
        /* FAVORITES LIST */
        <FlatList
          data={favVideos}
          keyExtractor={(item) => item.videoId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Link href={`/video/${item.videoId}`} asChild>
              <TouchableOpacity activeOpacity={0.9}>
                <View style={styles.card}>
                  <Image
                    source={{ uri: item.imageURL }}
                    style={styles.thumbnail}
                  />

                  <View style={styles.playOverlay}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.title}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.category}>
                        {item.language}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E5",
  },

  header: {
    backgroundColor: "#FF6FAE",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  subtitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginTop: 4,
  },

  empty: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    fontWeight: "800",
    color: "#999",
    paddingHorizontal: 24,
  },
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

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
  },

  thumbnail: {
    width: "100%",
    height: 180,
  },

  playOverlay: {
    position: "absolute",
    inset: 0,
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
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  durationText: {
    color: "#fff",
    fontWeight: "700",
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  emoji: {
    fontSize: 36,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
  },

  category: {
    fontSize: 14,
    color: "#777",
    fontWeight: "700",
  },
})
