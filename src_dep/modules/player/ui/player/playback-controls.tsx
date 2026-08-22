import type { RepeatModeType } from "@/modules/player/store"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"

import Animated, { Layout } from "react-native-reanimated"
import LocalNextSolidIcon from "@/modules/shared/components/icons/local/next-solid"
import LocalPauseCircleSolidIcon from "@/modules/shared/components/icons/local/pause-circle-solid"
import LocalPlayCircleSolidIcon from "@/modules/shared/components/icons/local/play-circle-solid"
import LocalPreviousSolidIcon from "@/modules/shared/components/icons/local/previous-solid"
import LocalRepeatIcon from "@/modules/shared/components/icons/local/repeat"
import LocalRepeatOne01Icon from "@/modules/shared/components/icons/local/repeat-one-01"
import LocalShuffleIcon from "@/modules/shared/components/icons/local/shuffle"
import { toggleRepeatMode } from "@/modules/player/controls"
import { useIsShuffled, usePlaybackRepeatMode } from "@/modules/player/selectors"
import { toggleShuffle } from "@/modules/player/queue"
import { useThemeColors } from "@/modules/ui/theme"
import { cn } from "@/utils/common"
import { useCastAwarePlayback } from "./use-cast-aware-playback"

interface PlaybackControlsProps {
  isPlaying: boolean
  compact?: boolean
}

function getRepeatIcon(mode: RepeatModeType) {
  return mode === "track" ? "repeat-once" : "repeat"
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  compact = false,
}) => {
  const theme = useThemeColors()
  const { effectiveIsPlaying, togglePlayback, playNext, playPrevious } =
    useCastAwarePlayback(isPlaying)
  const iconSize = compact ? 32 : 36
  const playButtonSize = compact ? 64 : 80
  const containerClass = compact ? "w-16 h-16" : "w-20 h-20"
  const gapClass = compact ? "gap-6" : "gap-8"
  const repeatMode = usePlaybackRepeatMode()
  const isShuffled = useIsShuffled()

  const getRepeatColor = (mode: RepeatModeType) => {
    return mode === "off" ? "white" : theme.accent
  }

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={cn("flex-row items-center justify-between", compact ? "mb-6" : "mb-8")}
    >
      <PressableFeedback
        onPress={toggleRepeatMode}
        className={cn(repeatMode === "off" && "opacity-60")}
      >
        {getRepeatIcon(repeatMode) === "repeat-once" ? (
          <LocalRepeatOne01Icon
            fill="none"
            width={24}
            height={24}
            color={getRepeatColor(repeatMode)}
          />
        ) : (
          <LocalRepeatIcon fill="none" width={24} height={24} color={getRepeatColor(repeatMode)} />
        )}
      </PressableFeedback>

      <View className={cn("flex-row items-center", gapClass)}>
        <PressableFeedback
          onPress={() => {
            void playPrevious()
          }}
        >
          <LocalPreviousSolidIcon fill="none" width={iconSize} height={iconSize} color="white" />
        </PressableFeedback>

        <PressableFeedback
          className={cn("items-center justify-center", containerClass)}
          onPress={() => {
            void togglePlayback()
          }}
        >
          {effectiveIsPlaying ? (
            <LocalPauseCircleSolidIcon
              fill="none"
              width={playButtonSize}
              height={playButtonSize}
              color="white"
            />
          ) : (
            <LocalPlayCircleSolidIcon
              fill="none"
              width={playButtonSize}
              height={playButtonSize}
              color="white"
            />
          )}
        </PressableFeedback>

        <PressableFeedback
          onPress={() => {
            void playNext()
          }}
        >
          <LocalNextSolidIcon fill="none" width={iconSize} height={iconSize} color="white" />
        </PressableFeedback>
      </View>

      <PressableFeedback onPress={toggleShuffle} className={cn(!isShuffled && "opacity-60")}>
        <LocalShuffleIcon
          fill="none"
          width={24}
          height={24}
          color={isShuffled ? theme.accent : "white"}
        />
      </PressableFeedback>
    </Animated.View>
  )
}
