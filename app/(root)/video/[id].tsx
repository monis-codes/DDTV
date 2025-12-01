import { Link, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";

import { videos } from "../../../data/videos";

export default function VideoScreen() {
  const { id } = useLocalSearchParams();
  const [playing, setPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get("window").width > Dimensions.get("window").height
  );

  const video = useMemo(() => videos.find((v) => v.id === id), [id]);
  const upNext = useMemo(
    () => videos.filter((v) => v.id !== id).slice(0, 4),
    [id]
  );

  // Handle screen rotation
  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setIsLandscape(window.width > window.height);
    };
    const subscription = Dimensions.addEventListener("change", onChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Lock/Unlock orientation logic
  useEffect(() => {
    // Start in portrait
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);

    return () => {
      // Restore portrait when leaving screen
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  const onStateChange = useCallback((state: string) => {
    if (state === "playing") {
      // Lock to landscape first
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).then(() => {
        // Then allow free rotation
        ScreenOrientation.unlockAsync();
      });
      setPlaying(true);
    }

    if (state === "paused" || state === "ended") {
      // Optional: return to portrait automatically
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      setPlaying(false);
    }
  }, []);

  if (!video) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity>
            <Text style={styles.back}>🎬 Back</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.headerTitle}>Adi&apos;s Video</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.videoWrapper, { height: isLandscape ? 260 : 220 }]}>
          <YoutubePlayer
            height={isLandscape ? 260 : 220}
            play={playing}
            videoId={video.youtubeId}
            onChangeState={onStateChange}
            webViewProps={{
              originWhitelist: ["*"],
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
            }}
            baseUrl={"https://www.youtube.com"}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>
            {video.emoji} {video.title}
          </Text>
          <Text style={styles.description}>{video.title}</Text>
        </View>

        <View style={styles.upNext}>
          <Text style={styles.upNextTitle}>✨ Up Next</Text>

          {upNext.map((v) => (
            <Link href={`/video/${v.id}`} asChild key={v.id}>
              <TouchableOpacity style={styles.nextCard}>
                <Image source={v.thumbnail} style={styles.nextThumb} />
                <View style={styles.nextOverlay}>
                  <Text style={styles.play}>▶</Text>
                  <Text style={styles.duration}>{v.duration}</Text>
                </View>
                <View style={styles.nextInfo}>
                  <Text style={styles.nextTitle}>{v.title}</Text>
                  <Text style={styles.nextCategory}>{v.category}</Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  nextCategory: {
    color: "#777",
    fontWeight: "700",
    marginTop: 2
  }
});
