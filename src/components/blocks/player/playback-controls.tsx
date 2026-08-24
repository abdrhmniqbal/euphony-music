import type { RepeatModeType } from "@/playback/types"
import { PressableFeedback, useThemeColor } from "heroui-native"
import * as React from "react"
import { View } from "react-native"

import Animated, { Layout } from "react-native-reanimated"
import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPauseCircleSolidIcon from "@/components/icons/local/pause-circle-solid"
import LocalPlayCircleSolidIcon from "@/components/icons/local/play-circle-solid"
import LocalPreviousSolidIcon from "@/components/icons/local/previous-solid"
import LocalRepeatIcon from "@/components/icons/local/repeat"
import LocalRepeatOne01Icon from "@/components/icons/local/repeat-one-01"
import LocalShuffleIcon from "@/components/icons/local/shuffle"
import { toggleRepeatMode } from "@/playback/controls"
import { useCastAwarePlayback } from "@/playback/cast-aware-playback"
import { useIsShuffled, usePlaybackRepeatMode } from "@/playback/selectors"
import { toggleShuffleMode } from "@/playback/queue-actions"
import { cn } from "tailwind-variants"

interface PlaybackControlsProps {
  isPlaying: boolean
  compact?: boolean
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  compact = false,
}) => {
  const accent = useThemeColor("accent")
  const iconSize = compact ? 32 : 36
  const playButtonSize = compact ? 64 : 80
  const containerClass = compact ? "w-16 h-16" : "w-20 h-20"
  const gapClass = compact ? "gap-6" : "gap-8"
  const repeatMode = usePlaybackRepeatMode()
  const isShuffled = useIsShuffled()
  const cast = useCastAwarePlayback(isPlaying)
  const togglePlayback = cast.togglePlayback
  const playNext = cast.playNext
  const playPrevious = cast.playPrevious

  const getRepeatColor = (mode: RepeatModeType) => {
    return mode === "off" ? "#FFFFFF" : accent
  }

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={cn("flex-row items-center justify-between", compact ? "mb-6" : "mb-8")}
    >
      <PressableFeedback
        onPress={() => void toggleRepeatMode()}
        className={cn(repeatMode === "off" && "opacity-60")}
      >
        {repeatMode === "track" ? (
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
          <LocalPreviousSolidIcon fill="none" width={iconSize} height={iconSize} color="#FFFFFF" />
        </PressableFeedback>

        <PressableFeedback
          className={cn("items-center justify-center", containerClass)}
          onPress={() => {
            void togglePlayback()
          }}
        >
          {isPlaying ? (
            <LocalPauseCircleSolidIcon
              fill="none"
              width={playButtonSize}
              height={playButtonSize}
              color="#FFFFFF"
            />
          ) : (
            <LocalPlayCircleSolidIcon
              fill="none"
              width={playButtonSize}
              height={playButtonSize}
              color="#FFFFFF"
            />
          )}
        </PressableFeedback>

        <PressableFeedback
          onPress={() => {
            void playNext()
          }}
        >
          <LocalNextSolidIcon fill="none" width={iconSize} height={iconSize} color="#FFFFFF" />
        </PressableFeedback>
      </View>

      <PressableFeedback
        onPress={() => void toggleShuffleMode()}
        className={cn(!isShuffled && "opacity-60")}
      >
        <LocalShuffleIcon
          fill="none"
          width={24}
          height={24}
          color={isShuffled ? accent : "#FFFFFF"}
        />
      </PressableFeedback>
    </Animated.View>
  )
}
