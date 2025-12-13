import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link, useLocalSearchParams, useRouter } from "expo-router"
import * as ScreenOrientation from "expo-screen-orientation"
import { useCallback, useEffect, useState } from "react"
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import YoutubePlayer from "react-native-youtube-iframe"

import { useAuth } from "../../../contexts/AuthContext"
import {
  addToFavorites,
  fetchVideosByLanguage,
  isVideoFavorited,
  removeFromFavorites,
  Video
} from "../../../lib/appwrite"

const FAV_KEY = "FAVOURITE_VIDEOS"

export default function VideoScreen() { 
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { user, isGuest } = useAuth()
  const [playing, setPlaying] = useState(false)
  const [isFavourite, setIsFavourite] = useState(false)
  const [video, setVideo] = useState<Video | null>(null)
  const [upNext, setUpNext] = useState<Video[]>([])

  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get("window").width > Dimensions.get("window").height
  )

  /* ============================
     LOAD VIDEO DATA
  ============================ */
  useEffect(() => {
    loadVideoData()
  }, [id])

  const loadVideoData = async () => {
    try {
      // For now, we'll need to fetch all videos and find the one with matching ID
      // In a real app, you'd have a getVideoById function
      const lang = await AsyncStorage.getItem("language") || "en"
      const allVideos = await fetchVideosByLanguage(lang)
      const foundVideo = allVideos.find((v) => v.videoId === id)
      
      if (foundVideo) {
        setVideo(foundVideo)
        // Set up next videos (excluding current)
        setUpNext(allVideos.filter((v) => v.videoId !== id).slice(0, 4))
        checkFavourite(foundVideo.videoId)
      }
    } catch (error) {
      console.error("Error loading video:", error)
    }
  }

  /* ============================
     LOAD FAVOURITE STATE
  ============================ */
  const checkFavourite = async (videoId: string) => {
    if (isGuest) {
      // For guests, use local storage
      const raw = await AsyncStorage.getItem(FAV_KEY)
      const favs: string[] = raw ? JSON.parse(raw) : []
      setIsFavourite(favs.includes(videoId))
    } else if (user) {
      // For logged-in users, check Appwrite
      try {
        const favorited = await isVideoFavorited(user.$id, videoId)
        setIsFavourite(favorited)
      } catch (error) {
        console.error("Error checking favorite:", error)
        // Fallback to local storage
        const raw = await AsyncStorage.getItem(FAV_KEY)
        const favs: string[] = raw ? JSON.parse(raw) : []
        setIsFavourite(favs.includes(videoId))
      }
    }
  }

  const toggleFavourite = async () => {
    if (!video) return

    // Gatekeeper: If guest, redirect to sign-in
    if (isGuest) {
      router.replace(`/sign-in?redirectVideoId=${video.videoId}`)
      return
    }

    // If logged in, save to Appwrite
    if (!user) {
      Alert.alert("Error", "Please sign in to favorite videos")
      return
    }

    try {
      if (isFavourite) {
        await removeFromFavorites(user.$id, video.videoId)
        setIsFavourite(false)
      } else {
        await addToFavorites(user.$id, video.videoId)
        setIsFavourite(true)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      Alert.alert("Error", "Failed to update favorite. Please try again.")
    }
  }

  /* ============================
     ORIENTATION HANDLING
  ============================ */
  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setIsLandscape(window.width > window.height)
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT
    )

    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      )
    }
  }, [])

  const onStateChange = useCallback((state: string) => {
    if (state === "playing") {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).then(() => ScreenOrientation.unlockAsync())
      setPlaying(true)
    }

    if (state === "paused" || state === "ended") {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      )
      setPlaying(false)
    }
  }, [])

  if (!video) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity>
            <Text style={styles.back}>🎬 Back</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.headerTitle}>Adi&apos;s Video</Text>

              {/* FAV BUTTON */}
      <TouchableOpacity
        onPress={toggleFavourite}
        style={styles.favButton}
      >
        <Text style={styles.favIcon}>
          {isFavourite ? "💛" : "🤍"}
        </Text>
      </TouchableOpacity>

      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* PLAYER */}
        <View
          style={[
            styles.videoWrapper,
            { height: isLandscape ? 260 : 220 },
          ]}
        >
          <YoutubePlayer
            height={isLandscape ? 260 : 220}
            play={playing}
            videoId={video.youtubeId}
            onChangeState={onStateChange}
            webViewProps={{
              originWhitelist: ["*"],
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            }}
            baseUrl={"https://www.youtube.com"}
          />
        </View>

        {/* INFO */}
        <View style={styles.info}>
          <Text style={styles.title}>
            {video.title}
          </Text>
          <Text style={styles.description}>{video.language}</Text>
        </View>

        {/* UP NEXT */}
        {upNext.length > 0 && (
          <View style={styles.upNext}>
            <Text style={styles.upNextTitle}>✨ Up Next</Text>

            {upNext.map((v) => (
              <Link href={`/video/${v.videoId}`} asChild key={v.videoId}>
                <TouchableOpacity style={styles.nextCard}>
                  <Image source={{ uri: v.imageURL }} style={styles.nextThumb} />

                  <View style={styles.nextOverlay}>
                    <Text style={styles.play}>▶</Text>
                  </View>

                  <View style={styles.nextInfo}>
                    <Text style={styles.nextTitle}>{v.title}</Text>
                    <Text style={styles.nextCategory}>
                      {v.language}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E5"
  },
  header: {
    backgroundColor: "#FF6FAE",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  back: {
    color: "#fff",
    fontWeight: "900"
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16
  },
  content: {
    padding: 16
  },
  videoWrapper: {
    backgroundColor: "#000",
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center"
  },
  info: {
    marginTop: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "900"
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22
  },
  upNext: {
    marginTop: 24
  },
  upNextTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12
  },
  nextCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden"
  },
  nextThumb: {
    width: "100%",
    height: 140
  },
  nextOverlay: {
    position: "absolute",
    top: 0,
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  play: {
    fontSize: 36,
    color: "#fff"
  },
  duration: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "700"
  },
  nextInfo: {
    padding: 12,
    backgroundColor: "#FFF2B2"
  },
  nextTitle: {
    fontWeight: "900"
  },
    favIcon: {
    fontSize: 24,
  },
  favButton: {
  paddingHorizontal: 8,
  paddingVertical: 4,
},
  nextCategory: {
    color: "#777",
    fontWeight: "700",
    marginTop: 2
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  }
});
