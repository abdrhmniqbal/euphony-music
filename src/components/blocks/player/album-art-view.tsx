import * as React from "react"
import { Image } from "expo-image"
import { View } from "react-native"
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated"

import { useThemeColors } from "@/hooks/use-theme-colors"
import type { Track } from "@/modules/player/player.store"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"

interface AlbumArtViewProps {
  currentTrack: Track
}

export const AlbumArtView: React.FC<AlbumArtViewProps> = ({ currentTrack }) => {
  const theme = useThemeColors()
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(300)}
      className="my-8 flex-1 items-center justify-center"
    >
      <View className="scale-0.9 absolute aspect-square w-full rounded-full blur-2xl" />
      <View className="elevation-10 aspect-square w-full overflow-hidden rounded-3xl shadow-2xl">
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
      </View>
    </Animated.View>
  )
}
