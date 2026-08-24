import { LinearGradient } from "expo-linear-gradient"
import { StyleSheet, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { PlayerTrack, PlaybackQueueContext } from "@/playback/types"
import type { PlayerExpandedView } from "@/core/ui/store"
import { usePlayerColorsStore } from "@/playback/colors-store"

import { AlbumArtView } from "./album-art-view"
import { PlaybackControls } from "./playback-controls"
import { LyricsView } from "./lyrics/lyrics-view"
import { PlayerFooter } from "./footer"
import { PlayerHeader } from "./header"
import { ProgressBar } from "./progress-bar"
import { QueueView } from "./queue-view"
import { TrackInfo } from "./track-info"

const BACKGROUND_DARKEN_OVERLAY = "rgba(0, 0, 0, 0.15)"

interface FullPlayerContentProps {
  currentTrack: PlayerTrack
  isPlaying: boolean
  playerExpandedView: PlayerExpandedView
  queueContext: PlaybackQueueContext | null
  onClose: () => void
  onOpenMore?: () => void
}

export function FullPlayerContent({
  currentTrack,
  isPlaying,
  playerExpandedView,
  queueContext,
  onClose,
  onOpenMore,
}: FullPlayerContentProps) {
  const colors = usePlayerColorsStore((state) => state.currentColors)
  const insets = useSafeAreaInsets()
  const isCompactLayout = playerExpandedView !== "artwork"
  const dragY = useSharedValue(0)
  const playerBottomPadding = insets.bottom + 32

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: dragY.value }],
    }
  })

  return (
    <Animated.View
      className="relative flex-1"
      style={[{ backgroundColor: colors.bg }, containerStyle]}
    >
      <LinearGradient
        colors={[colors.bg, colors.secondary, "#09090B"]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: BACKGROUND_DARKEN_OVERLAY }]}
      />

      <View
        className="flex-1 justify-between px-6 pt-12"
        style={{ paddingBottom: playerBottomPadding }}
      >
        <PlayerHeader
          onClose={onClose}
          onOpenMore={onOpenMore}
          dragY={dragY}
          queueContext={queueContext}
        />

        {playerExpandedView === "queue" ? (
          <QueueView />
        ) : playerExpandedView === "lyrics" ? (
          <LyricsView />
        ) : (
          <AlbumArtView currentTrack={currentTrack} />
        )}

        <TrackInfo track={currentTrack} compact={isCompactLayout} />

        <ProgressBar compact={isCompactLayout} />

        <PlaybackControls isPlaying={isPlaying} compact={isCompactLayout} />

        <PlayerFooter />
      </View>
    </Animated.View>
  )
}
