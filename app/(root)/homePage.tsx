import { Link } from "expo-router"
import React, { useState } from "react"
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ParentalControlModal } from "../../components/parentModal"
import { videos } from "../../data/videos"

export default function HomeScreen() {
  const [showParent, setShowParent] = useState(false)

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}   // ✅ handles notch/status bar
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🎬 DoomDoomTV</Text>
          <Text style={styles.welcome}>Welcome, Adi!</Text>
        </View>

        <TouchableOpacity
          style={styles.parentButton}
          onPress={() => setShowParent(true)}
        >
          <Text style={styles.parentButtonText}>Parental Control</Text>
        </TouchableOpacity>
      </View>

      {/* Video List */}
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Link href={`/video/${item.id}`} asChild>
            <TouchableOpacity activeOpacity={0.9}>
          <View style={styles.card}>
            <View>
              <Image source={item.thumbnail} style={styles.thumbnail} />

              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>

              <View style={styles.duration}>
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
            </View>
          </View>
          </TouchableOpacity>
          </Link>
        )}
      />

      <ParentalControlModal
        visible={showParent}
        onClose={() => setShowParent(false)}
      />
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
  paddingBottom: 16,
  paddingTop: 8, // ✅ safe-area already handled
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
    borderRadius: 16,
  },
  parentButtonText: {
    fontWeight: "900",
    color: "#FF6FAE",
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
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
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
