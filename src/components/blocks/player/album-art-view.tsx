import type { Track } from "@/modules/player/store"
import { Image } from "expo-image"
import * as React from "react"
import { View } from "react-native"

import Animated, { Layout } from "react-native-reanimated"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { useThemeColors } from "@/modules/ui/theme"

interface AlbumArtViewProps {
  currentTrack: Track
}

export const AlbumArtView: React.FC<AlbumArtViewProps> = ({ currentTrack }) => {
  const theme = useThemeColors()
  return (
    <Animated.View
      layout={Layout.duration(300)}
      className="my-8 flex-1 items-center justify-center"
    >
      <View className="scale-0.9 absolute aspect-square w-full rounded-full blur-2xl" />
      <Animated.View className="elevation-10 aspect-square w-full overflow-hidden rounded-3xl shadow-2xl">
        {currentTrack.image ? (
          <Image
            source={{ uri: currentTrack.image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-surface">
            <LocalMusicNoteSolidIcon
              fill="none"
              width={120}
              height={120}
              color={theme.muted}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
}
