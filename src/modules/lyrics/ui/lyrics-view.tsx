import type { Track } from "@/modules/player/types"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, useWindowDimensions, type LayoutChangeEvent } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated"
import LocalMicIcon from "@/components/icons/local/mic"
import { EmptyState } from "@/components/ui/empty-state"
import {
  useIsPlaying,
  usePlaybackCurrentTime,
  usePlaybackDuration,
} from "@/modules/player/selectors"
import { useThemeColors } from "@/modules/ui/theme"
import {
  setPlayerLyricsFontScale,
  setPlayerLyricsKaraokeEnabled,
  useUIStore,
} from "@/modules/ui/store"
import { seekTo } from "@/modules/player/controls"

import { useResolvedLyrics } from "../use-resolved-lyrics"
import { useLyricsPresentation } from "../use-lyrics-presentation"
import { useLyricsAutoScroll } from "../use-lyrics-auto-scroll"
import { TimedMarkupLyrics } from "./timed-markup-lyrics"
import { StaticLyrics } from "./static-lyrics"
import { SyncedLyrics } from "./synced-lyrics"

interface LyricsViewProps {
  track: Track | null
}

const KARAOKE_PROGRESS_TICK_SECONDS = 0.5
const KARAOKE_PROGRESS_ANIMATION_MS = 520
const FONT_SCALE_VALUES = [1, 1.2, 1.4] as const

function getInterpolatedPlaybackTimeTarget({
  duration,
  isPlaying,
  line,
  nextLine,
  time,
}: {
  duration: number
  isPlaying: boolean
  line: any
  nextLine: any
  time: number
}) {
  "worklet"

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

  const { data: resolvedLyrics = null } = useResolvedLyrics(track)

  const playbackTime = usePlaybackCurrentTime()
  const isPlaying = useIsPlaying()
  const playbackDuration = usePlaybackDuration()

  const {
    effectiveMode,
    hasStaticLyrics,
    hasSyncedLyrics,
    timedMarkupLines,
    staticDisplayLines,
    syncedLines,
    activeSyncedLineIndex,
    karaokeEnabled,
  } = useLyricsPresentation(resolvedLyrics, playbackTime)

  const activeLine =
    effectiveMode === "timedMarkup"
      ? timedMarkupLines[activeSyncedLineIndex]
      : effectiveMode === "synced"
        ? syncedLines[activeSyncedLineIndex]
        : undefined

  const [viewportHeight, setViewportHeight] = React.useState(0)
  const layoutCacheKey = `${track?.id ?? ""}:${effectiveMode}:${fontScale}`

  const { scrollViewRef, setSyncedLineOffset, handleUserScrollStart, handleUserScrollEnd } =
    useLyricsAutoScroll({
      layoutCacheKey,
      effectiveMode,
      fontScale,
      activeSyncedLineIndex,
      activeLine,
      viewportHeight,
    })

  const handleToggleKaraoke = React.useCallback(() => {
    if (!hasSyncedLyrics) {
      return
    }
    setPlayerLyricsKaraokeEnabled(!karaokeEnabled)
  }, [hasSyncedLyrics, karaokeEnabled])

  const handleToggleFontScale = React.useCallback(() => {
    const currentIndex = FONT_SCALE_VALUES.indexOf(fontScale)
    const nextIndex = (currentIndex + 1) % FONT_SCALE_VALUES.length
    const nextScale = FONT_SCALE_VALUES[nextIndex] ?? 1
    setPlayerLyricsFontScale(nextScale)
  }, [fontScale])

  const fontScaleLabel = React.useMemo(() => {
    const levelIndex = FONT_SCALE_VALUES.indexOf(fontScale)
    const level = levelIndex >= 0 ? levelIndex + 1 : 1
    return `×${level}`
  }, [fontScale])

  const handleSeek = React.useCallback((time: number) => {
    void seekTo(time)
  }, [])

  const currentTimeSv = useDerivedValue(() => {
    if (effectiveMode !== "timedMarkup") {
      return playbackTime
    }

    const line = timedMarkupLines[activeSyncedLineIndex]
    const nextLine = timedMarkupLines[activeSyncedLineIndex + 1]
    const targetTime = getInterpolatedPlaybackTimeTarget({
      duration: playbackDuration,
      isPlaying,
      line,
      nextLine,
      time: playbackTime,
    })

    return isPlaying
      ? withTiming(targetTime, {
          duration: KARAOKE_PROGRESS_ANIMATION_MS,
          easing: Easing.linear,
        })
      : playbackTime
  })

  if (!track) {
    return null
  }

  if (!hasStaticLyrics) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={Layout.duration(300)}
        className="-mx-2 my-3 flex-1 justify-center"
      >
        <EmptyState
          icon={<LocalMicIcon fill="none" width={36} height={36} color={theme.muted} />}
          title={t("library.empty.lyricsTitle")}
          message={t("library.empty.lyricsMessage")}
          className="py-0"
        />
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
        key={layoutCacheKey}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onScrollBeginDrag={handleUserScrollStart}
        onMomentumScrollBegin={handleUserScrollStart}
        onScrollEndDrag={handleUserScrollEnd}
        onMomentumScrollEnd={handleUserScrollEnd}
        onLayout={(event: LayoutChangeEvent) => {
          setViewportHeight(event.nativeEvent.layout.height)
        }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: Math.max(96, height * 0.24),
          paddingHorizontal: 8,
          gap: 10,
        }}
      >
        {effectiveMode === "timedMarkup" ? (
          <TimedMarkupLyrics
            lines={timedMarkupLines}
            activeSyncedLineIndex={activeSyncedLineIndex}
            fontScale={fontScale}
            onSeek={handleSeek}
            onLayoutLine={setSyncedLineOffset}
            currentTimeSv={currentTimeSv}
          />
        ) : effectiveMode === "static" ? (
          <StaticLyrics lines={staticDisplayLines} fontScale={fontScale} />
        ) : (
          <SyncedLyrics
            lines={syncedLines}
            activeSyncedLineIndex={activeSyncedLineIndex}
            fontScale={fontScale}
            onLayoutLine={setSyncedLineOffset}
          />
        )}
      </ScrollView>

      {hasSyncedLyrics ? (
        <PressableFeedback
          onPress={handleToggleKaraoke}
          className="absolute bottom-3 left-2 rounded-full px-3 py-2 active:opacity-90"
          style={{
            backgroundColor:
              effectiveMode !== "static" ? theme.foreground : "rgba(255, 255, 255, 0.14)",
          }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: effectiveMode !== "static" ? "#0A0A0A" : "white" }}
          >
            {effectiveMode !== "static" ? t("player.karaokeOn") : t("player.karaokeOff")}
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
