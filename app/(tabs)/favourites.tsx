import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link } from "expo-router"
import { useEffect, useState } from "react"
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { videos } from "../../data/videos"

const FAV_KEY = "FAVOURITE_VIDEOS"

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState<string[]>([])

  useEffect(() => {
    loadFavourites()
  }, [])

  const loadFavourites = async () => {
    const raw = await AsyncStorage.getItem(FAV_KEY)
    setFavourites(raw ? JSON.parse(raw) : [])
  }

  const favVideos = videos.filter((v) =>
    favourites.includes(v.id)
  )

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>❤️ Favourites</Text>
        <Text style={styles.subtitle}>
          Videos Adi loves watching
        </Text>
      </View>

      {/* EMPTY STATE */}
      {favVideos.length === 0 ? (
        <Text style={styles.empty}>
          No favourite videos yet 💖{"\n"}
          Tap ❤️ on a video to save it!
        </Text>
      ) : (
        <FlatList
          data={favVideos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Link href={`/video/${item.id}`} asChild>
              <TouchableOpacity activeOpacity={0.9}>
                <View style={styles.card}>
                  <Image
                    source={item.thumbnail}
                    style={styles.thumbnail}
                  />

                  <View style={styles.playOverlay}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>

                  <View style={styles.duration}>
                    <Text style={styles.durationText}>
                      {item.duration}
                    </Text>
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.emoji}>
                      {item.emoji}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.title}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.category}>
                        {item.category}
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
