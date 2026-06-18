/**
 * Purpose: Renders static, synced, and timed-markup lyrics with smooth karaoke progress, auto-scroll, and zoom controls.
 * Caller: FullPlayerContent when the player expanded view is lyrics.
 * Dependencies: lyrics parsers/source resolver, player controls/store, UI store, theme colors, React Query, Reanimated timing.
 * Main Functions: LyricsView()
 * Side Effects: Reads lyrics metadata/DB fallback, seeks playback, updates session-only lyrics preferences.
 */

import type { Track } from "@/modules/player/types"
import { useQuery } from "@tanstack/react-query"
import { PressableFeedback } from "heroui-native"
import * as React from "react"

import { type LayoutChangeEvent, ScrollView, Text, useWindowDimensions, View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated"
import LocalMicIcon from "@/components/icons/local/mic"
import { EmptyState } from "@/components/ui/empty-state"
import { queryClient } from "@/lib/tanstack-query"
import {
  hasMeaningfulSyncedLyricsTiming,
  hasMeaningfulTimedMarkupTiming,
  parseTimedMarkupLines,
  parseSyncedLyricsLines,
  splitLyricsLines,
  type TimedMarkupLine,
} from "@/modules/lyrics"
import { scheduleLyricsAutoScroll } from "@/modules/lyrics/auto-scroll-runtime"
import { resolveTrackLyricsSource } from "@/modules/lyrics/source"
import {
  findSyncedLineIndex,
  findTimedMarkupLineIndex,
  getTimedMarkupDisplayText,
  getTimedMarkupLineText,
  getTimedMarkupWordGroups,
  hasWordLevelTiming,
  stripMalformedUtf16LyricsPrefix,
} from "@/modules/lyrics/view-utils"
import { seekTo } from "@/modules/player/controls"
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
import { logWarn } from "@/modules/logging/service"

type LyricsMode = "static" | "synced" | "timedMarkup"

interface ReadableSharedValue<T> {
  readonly value: T
}

interface LyricsViewProps {
  track: Track | null
}

const AUTO_SCROLL_RESUME_DELAY_MS = 100
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
  line: TimedMarkupLine | undefined
  nextLine: TimedMarkupLine | undefined
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

const TimedMarkupWordSpan: React.FC<{
  text: string
  begin: number
  end: number
  currentTimeSv: ReadableSharedValue<number>
  lineActive: boolean
  linePast: boolean
  fontScale: number
}> = ({ text, begin, end, currentTimeSv, lineActive, linePast, fontScale }) => {
  const [textWidth, setTextWidth] = React.useState(0)

  const baseColor = lineActive
    ? "rgba(255,255,255,0.46)"
    : linePast
      ? "rgba(255,255,255,0.54)"
      : "rgba(255,255,255,0.20)"

  const activeColor = "rgba(255,255,255,0.96)"

  const fontSize = (lineActive ? 24 : 18) * fontScale
  const lineHeight = (lineActive ? 36 : 28) * fontScale
  const fontWeight = lineActive ? "700" : "600"

  const displayText = getTimedMarkupDisplayText(text)
  const wordProgressSv = useDerivedValue(() => {
    const wordDuration = Math.max(end - begin, 0.001)
    const currentTime = currentTimeSv.value
    return linePast
      ? 1
      : lineActive
        ? Math.max(0, Math.min(1, (currentTime - begin) / wordDuration))
        : 0
  }, [begin, end, lineActive, linePast])

  const foregroundClipStyle = useAnimatedStyle(() => {
    return {
      width: textWidth * wordProgressSv.value,
    }
  }, [textWidth])

  return (
    <View style={{ position: "relative", justifyContent: "center" }}>
      <Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        style={{
          color: baseColor,
          fontSize,
          lineHeight,
          fontWeight,
          letterSpacing: 0,
          paddingHorizontal: 0,
          marginHorizontal: 0,
        }}
      >
        {displayText}
      </Text>
      {textWidth > 0 && (
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 0,
              overflow: "hidden",
            },
            foregroundClipStyle,
          ]}
        >
          <Animated.View
            style={{
              width: textWidth,
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Animated.Text
              style={{
                color: activeColor,
                fontSize,
                lineHeight,
                fontWeight,
                letterSpacing: 0,
                paddingHorizontal: 0,
                marginHorizontal: 0,
                width: textWidth,
              }}
            >
              {displayText}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}

const TimedMarkupLineRow: React.FC<{
  line: TimedMarkupLine
  isActive: boolean
  isPast: boolean
  fontScale: number
  onSeek: (time: number, text?: string) => void
  onLayoutLine: (id: string, y: number) => void
  currentTimeSv: ReadableSharedValue<number>
}> = ({ line, isActive, isPast, fontScale, onSeek, onLayoutLine, currentTimeSv }) => {
  const lineText = React.useMemo(() => getTimedMarkupLineText(line).trim(), [line])
  const handlePress = React.useCallback(
    () => onSeek(line.begin, lineText),
    [line.begin, lineText, onSeek]
  )
  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => onLayoutLine(line.id, event.nativeEvent.layout.y),
    [line.id, onLayoutLine]
  )
  const wordGroups = React.useMemo(() => getTimedMarkupWordGroups(line), [line])
  const canRenderWordProgress = isActive && hasWordLevelTiming(line)
  const textColor = isActive
    ? "rgba(255,255,255,0.96)"
    : isPast
      ? "rgba(255,255,255,0.54)"
      : "rgba(255,255,255,0.20)"
  const fontSize = (isActive ? 24 : 18) * fontScale
  const lineHeight = (isActive ? 36 : 28) * fontScale
  const fontWeight = isActive ? "700" : "600"

  return (
    <PressableFeedback
      onPress={handlePress}
      className="py-1 active:opacity-85"
      onLayout={handleLayout}
    >
      {canRenderWordProgress ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            columnGap: Math.max(4, 6 * fontScale),
          }}
        >
          {wordGroups.map((group) => (
            <View
              key={`${line.id}-${group[0]?.begin ?? 0}-${group.map((word) => word.text).join("")}`}
              style={{ flexDirection: "row" }}
            >
              {group.map((word) => (
                <TimedMarkupWordSpan
                  key={`${line.id}-${word.begin}-${word.end}-${word.text}`}
                  text={word.text}
                  begin={word.begin}
                  end={word.end}
                  currentTimeSv={currentTimeSv}
                  lineActive={isActive}
                  linePast={isPast}
                  fontScale={fontScale}
                />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <Text
          selectable={false}
          style={{
            color: textColor,
            fontSize,
            lineHeight,
            fontWeight,
            letterSpacing: 0,
          }}
        >
          {lineText}
        </Text>
      )}
    </PressableFeedback>
  )
}

export const LyricsView: React.FC<LyricsViewProps> = ({ track }) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { height } = useWindowDimensions()
  const karaokeEnabled = useUIStore((state) => state.playerLyricsKaraokeEnabled)
  const fontScale = useUIStore((state) => state.playerLyricsFontScale)
  const { data: resolvedLyrics = null } = useQuery(
    {
      queryKey: [
        "track-lyrics-source",
        track?.id ?? "",
        track?.uri ?? "",
        track?.fileHash ?? "",
        track?.scanTime ?? 0,
      ],
      enabled: Boolean(track?.id),
      staleTime: Infinity,
      queryFn: async () => {
        let sourceTrack = track
        if (sourceTrack?.id && !sourceTrack.lyrics) {
          try {
            const { db } = await import("@/db/client")
            const { tracks } = await import("@/db/schema")
            const { eq } = await import("drizzle-orm")
            const dbTrack = await db.query.tracks.findFirst({
              where: eq(tracks.id, sourceTrack.id),
              columns: { lyrics: true },
            })
            if (dbTrack?.lyrics) {
              sourceTrack = { ...sourceTrack, lyrics: dbTrack.lyrics }
            }
          } catch (error) {
            logWarn("Failed to hydrate lyrics from database fallback", {
              error,
              trackId: sourceTrack.id,
            })
          }
        }

        const source = await resolveTrackLyricsSource(sourceTrack)
        return source ?? null
      },
      placeholderData: () => {
        const metadataLyrics = track?.lyrics
          ? stripMalformedUtf16LyricsPrefix(track.lyrics).trim()
          : ""
        return metadataLyrics ? metadataLyrics : null
      },
    },
    queryClient
  )

  const timedMarkupLines = React.useMemo(
    () => (resolvedLyrics ? parseTimedMarkupLines(resolvedLyrics) : []),
    [resolvedLyrics]
  )
  const hasTimedMarkup = React.useMemo(
    () => hasMeaningfulTimedMarkupTiming(timedMarkupLines),
    [timedMarkupLines]
  )
  const hasTimedMarkupLyrics = timedMarkupLines.length > 0
  const lines = React.useMemo(
    () => (hasTimedMarkupLyrics ? [] : splitLyricsLines(resolvedLyrics)),
    [hasTimedMarkupLyrics, resolvedLyrics]
  )
  const syncedLines = React.useMemo(
    () => (hasTimedMarkupLyrics ? [] : parseSyncedLyricsLines(resolvedLyrics)),
    [hasTimedMarkupLyrics, resolvedLyrics]
  )
  const hasTimedSyncedLyrics = React.useMemo(
    () => hasMeaningfulSyncedLyricsTiming(syncedLines),
    [syncedLines]
  )

  const hasStaticLyrics = lines.length > 0 || hasTimedMarkupLyrics
  const hasSyncedLyrics = hasTimedSyncedLyrics || hasTimedMarkup

  const effectiveMode: LyricsMode = hasTimedMarkup
    ? karaokeEnabled
      ? "timedMarkup"
      : "static"
    : karaokeEnabled && hasTimedSyncedLyrics
      ? "synced"
      : "static"

  const scrollViewRef = React.useRef<ScrollView | null>(null)
  const syncedLineOffsetRef = React.useRef<Record<string, number>>({})
  const isUserScrollingRef = React.useRef(false)
  const autoScrollResumeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const layoutCacheKeyRef = React.useRef("")
  const [viewportHeight, setViewportHeight] = React.useState(0)
  const playbackTime = usePlaybackCurrentTime()
  const isPlaying = useIsPlaying()
  const playbackDuration = usePlaybackDuration()

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

  const activeSyncedLineIndex = React.useMemo(() => {
    if (effectiveMode === "timedMarkup") {
      return findTimedMarkupLineIndex(timedMarkupLines, playbackTime)
    }

    if (effectiveMode === "synced") {
      return findSyncedLineIndex(syncedLines, playbackTime)
    }

    return -1
  }, [effectiveMode, playbackTime, syncedLines, timedMarkupLines])

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

  const layoutCacheKey = `${track?.id ?? ""}:${effectiveMode}:${fontScale}`
  if (layoutCacheKeyRef.current !== layoutCacheKey) {
    layoutCacheKeyRef.current = layoutCacheKey
    syncedLineOffsetRef.current = {}
    isUserScrollingRef.current = false
  }

  const setSyncedLineOffset = React.useCallback((lineId: string, y: number) => {
    const current = syncedLineOffsetRef.current[lineId]
    if (current === undefined || Math.abs(current - y) > 1) {
      syncedLineOffsetRef.current[lineId] = y
    }
  }, [])

  const clearAutoScrollResumeTimeout = React.useCallback(() => {
    if (autoScrollResumeTimeoutRef.current !== null) {
      clearTimeout(autoScrollResumeTimeoutRef.current)
      autoScrollResumeTimeoutRef.current = null
    }
  }, [])

  const scheduleAutoScrollResume = React.useCallback(() => {
    clearAutoScrollResumeTimeout()
    autoScrollResumeTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
      autoScrollResumeTimeoutRef.current = null
    }, AUTO_SCROLL_RESUME_DELAY_MS)
  }, [clearAutoScrollResumeTimeout])

  const handleUserScrollStart = React.useCallback(() => {
    isUserScrollingRef.current = true
    clearAutoScrollResumeTimeout()
  }, [clearAutoScrollResumeTimeout])

  const handleUserScrollEnd = React.useCallback(() => {
    scheduleAutoScrollResume()
  }, [scheduleAutoScrollResume])

  const isSyncedMode = effectiveMode === "synced" || effectiveMode === "timedMarkup"
  const activeLines = effectiveMode === "timedMarkup" ? timedMarkupLines : syncedLines
  const activeLine = activeLines[activeSyncedLineIndex]

  scheduleLyricsAutoScroll({
    key: `${layoutCacheKey}:${activeLine?.id ?? "none"}:${viewportHeight}`,
    enabled:
      isSyncedMode &&
      activeSyncedLineIndex >= 0 &&
      viewportHeight > 0 &&
      !isUserScrollingRef.current,
    scrollView: scrollViewRef.current,
    measuredY: activeLine ? syncedLineOffsetRef.current[activeLine.id] : undefined,
    fallbackY: activeSyncedLineIndex * 52 * fontScale,
    viewportHeight,
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

  const timedMarkupStaticLines = hasTimedMarkupLyrics
    ? timedMarkupLines.map((line) => ({
        id: line.id,
        text: line.words
          .map((w) => w.text)
          .join("")
          .trim(),
        isSpacer: false,
      }))
    : []

  const staticDisplayLines = hasTimedMarkupLyrics ? timedMarkupStaticLines : lines

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
        {effectiveMode === "timedMarkup"
          ? timedMarkupLines.map((line, index) => {
              const isActive = index === activeSyncedLineIndex
              const isPast = activeSyncedLineIndex >= 0 && index < activeSyncedLineIndex

              return (
                <TimedMarkupLineRow
                  key={line.id}
                  line={line}
                  isActive={isActive}
                  isPast={isPast}
                  fontScale={fontScale}
                  onSeek={handleSeek}
                  onLayoutLine={setSyncedLineOffset}
                  currentTimeSv={currentTimeSv}
                />
              )
            })
          : effectiveMode === "static"
            ? staticDisplayLines.map((line) => {
                if (line.isSpacer) {
                  return <View key={line.id} style={{ height: 14 }} />
                }

                return (
                  <PressableFeedback key={line.id} className="py-1 active:opacity-85">
                    <Text
                      selectable={false}
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 20 * fontScale,
                        lineHeight: 32 * fontScale,
                        fontWeight: "700",
                        letterSpacing: 0,
                      }}
                    >
                      {line.text}
                    </Text>
                  </PressableFeedback>
                )
              })
            : syncedLines.map((line, index) => {
                const isActive = index === activeSyncedLineIndex
                const isPast = activeSyncedLineIndex >= 0 && index < activeSyncedLineIndex

                return (
                  <PressableFeedback
                    key={line.id}
                    onPress={() => {
                      void seekTo(line.time)
                    }}
                    className="py-1 active:opacity-85"
                    onLayout={(event) => setSyncedLineOffset(line.id, event.nativeEvent.layout.y)}
                  >
                    <Text
                      selectable={false}
                      style={{
                        color: isActive
                          ? "rgba(255,255,255,0.96)"
                          : isPast
                            ? "rgba(255,255,255,0.48)"
                            : "rgba(255,255,255,0.22)",
                        fontSize: (isActive ? 22 : 18) * fontScale,
                        lineHeight: (isActive ? 34 : 28) * fontScale,
                        fontWeight: isActive ? "700" : "600",
                        letterSpacing: 0,
                      }}
                    >
                      {line.text}
                    </Text>
                  </PressableFeedback>
                )
              })}
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
