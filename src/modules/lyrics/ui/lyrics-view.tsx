import type { Track } from "@/modules/player/types"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View, useWindowDimensions, type LayoutChangeEvent } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated"
import LocalMic01Icon from "@/components/icons/local/mic-01"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import {
  useIsPlaying,
  usePlaybackDuration,
} from "@/modules/player/selectors"
import { useThemeColors } from "@/modules/ui/theme"
import {
  setPlayerLyricsFontScale,
  setPlayerLyricsKaraokeEnabled,
  useUIStore,
} from "@/modules/ui/store"
import { seekTo } from "@/modules/player/controls"
import type { TimedLine } from "@/modules/lyrics"
import { useLyrics } from "@/modules/lyrics"
import { TimedMarkupLyrics } from "./timed-markup-lyrics"
import { StaticLyrics } from "./static-lyrics"
import { SyncedLyrics } from "./synced-lyrics"

interface LyricsViewProps {
  track: Track | null
}

const KARAOKE_PROGRESS_TICK_SECONDS = 0.5
const KARAOKE_PROGRESS_ANIMATION_MS = 520
const FONT_SCALE_VALUES = [1, 1.2, 1.4] as const

function getInterpolatedPlaybackTimeTarget(args: {
  duration: number
  isPlaying: boolean
  line: TimedLine | undefined
  nextLine: TimedLine | undefined
  time: number
}): number {
  "worklet"

  const { duration, isPlaying, line, nextLine, time } = args
  if (!isPlaying) {
    return time
  }

  let targetTime = time + KARAOKE_PROGRESS_TICK_SECONDS
  if (duration > 0) {
    targetTime = Math.min(duration, targetTime)
  }
  if (line && line.end > line.begin && time < line.end) {
    targetTime = Math.min(targetTime, line.end)
  }
  if (nextLine && nextLine.begin > time) {
    targetTime = Math.min(targetTime, nextLine.begin)
  }
  return targetTime
}

export const LyricsView: React.FC<LyricsViewProps> = ({ track }) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { height } = useWindowDimensions()
  const fontScale = useUIStore((state) => state.playerLyricsFontScale)
  const isPlaying = useIsPlaying()
  const playbackDuration = usePlaybackDuration()

  const {
    doc,
    mode,
    activeIndex,
    karaokeEnabled,
    playbackTime,
    isLoading,
    scrollViewRef,
    setLineOffset,
    onUserScrollStart,
    onUserScrollEnd,
    setViewportHeight,
  } = useLyrics(track)

  const hasLyrics = doc.kind !== "empty"
  const hasSynced = doc.kind === "synced" || doc.kind === "timed"

  const handleToggleKaraoke = React.useCallback(() => {
    if (!hasSynced) {
      return
    }
    setPlayerLyricsKaraokeEnabled(!karaokeEnabled)
  }, [hasSynced, karaokeEnabled])

  const handleToggleFontScale = React.useCallback(() => {
    const nextIndex = (FONT_SCALE_VALUES.indexOf(fontScale) + 1) % FONT_SCALE_VALUES.length
    setPlayerLyricsFontScale(FONT_SCALE_VALUES[nextIndex] ?? 1)
  }, [fontScale])

  const fontScaleLabel = `×${(FONT_SCALE_VALUES.indexOf(fontScale) + 1) || 1}`

  const handleSeek = React.useCallback((time: number) => {
    void seekTo(time)
  }, [])

  const currentTimeSv = useDerivedValue(() => {
    if (mode !== "timed" || doc.kind !== "timed") {
      return playbackTime
    }

    const line = doc.lines[activeIndex]
    const nextLine = doc.lines[activeIndex + 1]
    const target = getInterpolatedPlaybackTimeTarget({
      duration: playbackDuration,
      isPlaying,
      line,
      nextLine,
      time: playbackTime,
    })

    return isPlaying
      ? withTiming(target, { duration: KARAOKE_PROGRESS_ANIMATION_MS, easing: Easing.linear })
      : playbackTime
  }, [mode, doc, activeIndex, playbackTime, playbackDuration, isPlaying])

  if (!track) {
    return null
  }

  if (!hasLyrics) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={Layout.duration(300)}
        className="-mx-2 my-3 flex-1 justify-center"
      >
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ScaleLoader size={22} />
          </View>
        ) : (
          <EmptyState
            icon={<LocalMic01Icon fill="none" width={36} height={36} color={theme.muted} />}
            title={t("library.empty.lyricsTitle")}
            message={t("library.empty.lyricsMessage")}
            className="py-0"
          />
        )}
      </Animated.View>
    )
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(300)}
      className="-mx-2 my-3 flex-1 overflow-hidden"
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onScrollBeginDrag={onUserScrollStart}
        onMomentumScrollBegin={onUserScrollStart}
        onScrollEndDrag={onUserScrollEnd}
        onMomentumScrollEnd={onUserScrollEnd}
        onLayout={(event: LayoutChangeEvent) => setViewportHeight(event.nativeEvent.layout.height)}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: Math.max(96, height * 0.24),
          paddingHorizontal: 8,
          gap: 10,
        }}
      >
        {doc.kind === "timed" ? (
          <TimedMarkupLyrics
            lines={doc.lines}
            activeIndex={mode === "timed" ? activeIndex : -1}
            fontScale={fontScale}
            onSeek={handleSeek}
            onLayoutLine={setLineOffset}
            currentTimeSv={currentTimeSv}
          />
        ) : doc.kind === "synced" ? (
          <SyncedLyrics
            lines={doc.lines}
            activeIndex={mode === "synced" ? activeIndex : -1}
            fontScale={fontScale}
            onLayoutLine={setLineOffset}
          />
        ) : doc.kind === "static" ? (
          <StaticLyrics lines={doc.lines} fontScale={fontScale} />
        ) : null}
      </ScrollView>

      {hasSynced ? (
        <PressableFeedback
          onPress={handleToggleKaraoke}
          className="absolute bottom-3 left-2 rounded-full px-3 py-2 active:opacity-90"
          style={{
            backgroundColor: karaokeEnabled ? theme.foreground : "rgba(255, 255, 255, 0.14)",
          }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: karaokeEnabled ? "#0A0A0A" : "white" }}
          >
            {karaokeEnabled ? t("player.karaokeOn") : t("player.karaokeOff")}
          </Text>
        </PressableFeedback>
      ) : null}

      <PressableFeedback
        onPress={handleToggleFontScale}
        className="absolute right-2 bottom-3 rounded-full px-3 py-2 active:opacity-90"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.14)" }}
      >
        <Text className="text-xs font-semibold text-white">{fontScaleLabel}</Text>
      </PressableFeedback>
    </Animated.View>
  )
}
