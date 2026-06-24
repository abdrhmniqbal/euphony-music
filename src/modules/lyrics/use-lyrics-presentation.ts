import * as React from "react"
import {
  hasMeaningfulSyncedLyricsTiming,
  hasMeaningfulTimedMarkupTiming,
  parseSyncedLyricsLines,
  parseTimedMarkupLines,
  splitLyricsLines,
} from "@/modules/lyrics"
import { findSyncedLineIndex, findTimedMarkupLineIndex } from "@/modules/lyrics/view-utils"
import { useUIStore } from "@/modules/ui/store"

export type LyricsMode = "static" | "synced" | "timedMarkup"

export function useLyricsPresentation(resolvedLyrics: string | null, playbackTime: number) {
  const karaokeEnabled = useUIStore((state) => state.playerLyricsKaraokeEnabled)

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

  const activeSyncedLineIndex = React.useMemo(() => {
    if (effectiveMode === "timedMarkup") {
      return findTimedMarkupLineIndex(timedMarkupLines, playbackTime)
    }

    if (effectiveMode === "synced") {
      return findSyncedLineIndex(syncedLines, playbackTime)
    }

    return -1
  }, [effectiveMode, playbackTime, syncedLines, timedMarkupLines])

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

  return {
    effectiveMode,
    hasStaticLyrics,
    hasSyncedLyrics,
    timedMarkupLines,
    staticDisplayLines,
    syncedLines,
    activeSyncedLineIndex,
    karaokeEnabled,
  }
}
