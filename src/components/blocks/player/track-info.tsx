import type { PlayerTrack } from "@/playback/types"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { Layout } from "react-native-reanimated"

import { cn } from "tailwind-variants"
import { MarqueeText } from "@/components/ui/marquee-text"

interface TrackInfoProps {
  track: PlayerTrack
  compact?: boolean
}

// Favorite toggle lands with the detail screens phase (P7); the artist press
// hook point is added there too.
export const TrackInfo: React.FC<TrackInfoProps> = ({ track, compact = false }) => {
  const { t } = useTranslation()
  const titleClassName = cn("mb-1 font-bold text-white", compact ? "text-xl" : "text-2xl")
  const artistClassName = cn("text-white/60", compact ? "text-base" : "text-lg")
  const artistName = track.artist?.trim() || t("library.unknownArtist")

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={`mt-auto flex-row items-center justify-between ${compact ? "mb-3" : "mb-6"}`}
    >
      <View className="mr-4 flex-1">
        <MarqueeText text={track.title} className={titleClassName} />
        <MarqueeText text={artistName} className={artistClassName} />
      </View>
    </Animated.View>
  )
}
