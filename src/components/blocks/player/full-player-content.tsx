import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalMic01Icon from "@/components/icons/local/mic-01"
import { EmptyState } from "@/components/ui/empty-state"
import type { PlayerTrack } from "@/playback/types"
import type { PlayerExpandedView } from "@/core/ui/store"
import { usePlayerColorsStore } from "@/playback/colors-store"

import { AlbumArtView } from "./album-art-view"
import { PlaybackControls } from "./playback-controls"
import { PlayerFooter } from "./footer"
import { PlayerHeader } from "./header"
import { ProgressBar } from "./progress-bar"
import { QueueView } from "./queue-view"
import { TrackInfo } from "./track-info"

const BACKGROUND_DARKEN_OVERLAY = "rgba(0, 0, 0, 0.15)"

function LyricsPlaceholder() {
  const { t } = useTranslation()
  return (
    <View className="my-8 flex-1 items-center justify-center">
      <EmptyState
        icon={<LocalMic01Icon fill="none" width={48} height={48} color="rgba(255,255,255,0.4)" />}
        title={t("player.lyrics.comingSoonTitle")}
        message={t("player.lyrics.comingSoonMessage")}
      />
    </View>
  )
}

interface FullPlayerContentProps {
  currentTrack: PlayerTrack
  isPlaying: boolean
  playerExpandedView: PlayerExpandedView
  queueContext: import("@/playback/types").PlaybackQueueContext | null
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
          <LyricsPlaceholder />
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
