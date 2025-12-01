import { ImageSourcePropType } from "react-native"

export interface Video {
  id: string
  title: string
  thumbnail: ImageSourcePropType
  duration: string
  category: string
  emoji: string
  youtubeId: string
}

export const videos: Video[] = [
  {
    id: "1",
    title:
      "Duck Colors Song – Doom Doom Doom | English Kids Rhyme | Learn Colors with Duck Family.",
    thumbnail: require("../assets/images/thumb1.webp"),
    duration: "3:45",
    category: "Songs",
    emoji: "🎵",
    youtubeId: "Rc4967cMQIA",
  },
  {
    id: "2",
    title:
      "Grandma’s Circus Fun | Doom Doom English Kids Song 🎪👵🎵",
    thumbnail: require("../assets/images/thumb2.webp"),
    duration: "4:10",
    category: "Songs",
    emoji: "🎪",
    youtubeId: "QRDv_CdETSA",
  },
  {
    id: "3",
    title:
      "Grandma Has Come! A joyful, heartwarming English kids’ song from Doom Doom",
    thumbnail: require("../assets/images/thumb3.webp"),
    duration: "3:50",
    category: "Poems",
    emoji: "👵",
    youtubeId: "KfF0qKfD-QA",
  },
  {
    id: "4",
    title:
      "Doom Doom, My Grandma Dear | Kids Song | A Heartwarming Grandma Rhyme by Doom Doom TV",
    thumbnail: require("../assets/images/thumb4.webp"),
    duration: "4:25",
    category: "Learning",
    emoji: "❤️",
    youtubeId: "VPC8ofV2b4k",
  },
]
