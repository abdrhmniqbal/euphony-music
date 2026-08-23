import * as React from "react"
import { ScrollView } from "react-native"
import { useQuery } from "@tanstack/react-query"

import { useUIStore } from "@/core/ui/store"
import type { PlayerTrack } from "@/playback/types"
import { usePlaybackProgressState } from "@/playback/selectors"
import {
  fetchAndPersistLyrics,
  loadLyricsFromDatabase,
} from "@/domains/lyrics/source"
import {
  findSyncedLineIndex,
  findTimedLineIndex,
  parseLyrics,
  type LyricsDoc,
} from "@/domains/lyrics/parser"

export type LyricsMode = "static" | "synced" | "timed"

const AUTO_SCROLL_ANCHOR_RATIO = 0.42
const AUTO_SCROLL_RESUME_DELAY_MS = 100

export interface UseLyricsResult {
  doc: LyricsDoc
  mode: LyricsMode
  activeIndex: number
  karaokeEnabled: boolean
  playbackTime: number
  scrollViewRef: React.RefObject<ScrollView | null>
  setLineOffset: (id: string, y: number) => void
  onUserScrollStart: () => void
  onUserScrollEnd: () => void
  setViewportHeight: (height: number) => void
  isLoading: boolean
}

function resolveLyricsSource(track: PlayerTrack | null): string | undefined {
  if (!track?.lyrics) {
    return undefined
  }
  const trimmed = track.lyrics.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function useLyrics(track: PlayerTrack | null): UseLyricsResult {
  const { currentTime: playbackTime } = usePlaybackProgressState()
  const karaokeEnabled = useUIStore((state) => state.playerLyricsKaraokeEnabled)

  const { data: rawLyrics = null, isLoading } = useQuery({
    queryKey: [
      "track-lyrics",
      track?.id ?? "",
      track?.uri ?? "",
      track?.fileHash ?? "",
      track?.scanTime ?? 0,
    ],
    enabled: Boolean(track?.id),
    staleTime: Infinity,
    queryFn: async () => {
      const metadataLyrics = resolveLyricsSource(track)
      if (metadataLyrics) {
        return metadataLyrics
      }

      if (track?.lyrics === "") {
        return null
      }

      if (track?.id) {
        const dbLyrics = await loadLyricsFromDatabase(track.id)
        if (dbLyrics) {
          return dbLyrics
        }
      }

      if (track?.id && track?.title && !track.isExternal) {
        const fetched = await fetchAndPersistLyrics(track)
        if (fetched) {
          return fetched.trim().length > 0 ? fetched : null
        }
      }

      return null
    },
    placeholderData: () => resolveLyricsSource(track) ?? null,
  })

  const doc = React.useMemo(() => parseLyrics(rawLyrics), [rawLyrics])

  const baseMode: LyricsMode =
    doc.kind === "timed" ? "timed" : doc.kind === "synced" ? "synced" : "static"
  const mode: LyricsMode =
    baseMode === "timed" || baseMode === "synced" ? (karaokeEnabled ? baseMode : "static") : "static"

  const activeIndex = React.useMemo(() => {
    if (mode === "timed" && doc.kind === "timed") {
      return findTimedLineIndex(doc.lines, playbackTime)
    }
    if (mode === "synced" && doc.kind === "synced") {
      return findSyncedLineIndex(doc.lines, playbackTime)
    }
    return -1
  }, [mode, doc, playbackTime])

  return {
    ...useAutoScroll(doc, mode, activeIndex),
    doc,
    mode,
    activeIndex,
    karaokeEnabled,
    playbackTime,
    isLoading,
  }
}

function useAutoScroll(
  doc: LyricsDoc,
  mode: LyricsMode,
  activeIndex: number
): Pick<
  UseLyricsResult,
  "scrollViewRef" | "setLineOffset" | "onUserScrollStart" | "onUserScrollEnd" | "setViewportHeight"
> {
  const scrollViewRef = React.useRef<ScrollView | null>(null)
  const offsetsRef = React.useRef<Record<string, number>>({})
  const isUserScrollingRef = React.useRef(false)
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewportHeightRef = React.useRef(0)
  const lastScrollKeyRef = React.useRef<string | null>(null)

  const setLineOffset = React.useCallback((id: string, y: number) => {
    const current = offsetsRef.current[id]
    if (current === undefined || Math.abs(current - y) > 1) {
      offsetsRef.current[id] = y
    }
  }, [])

  const clearResumeTimer = React.useCallback(() => {
    if (resumeTimerRef.current !== null) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }, [])

  const onUserScrollStart = React.useCallback(() => {
    isUserScrollingRef.current = true
    clearResumeTimer()
  }, [clearResumeTimer])

  const onUserScrollEnd = React.useCallback(() => {
    clearResumeTimer()
    resumeTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
      resumeTimerRef.current = null
    }, AUTO_SCROLL_RESUME_DELAY_MS)
  }, [clearResumeTimer])

  const setViewportHeight = React.useCallback((height: number) => {
    viewportHeightRef.current = height
  }, [])

  const isSynced = mode === "synced" || mode === "timed"

  React.useEffect(() => {
    if (!isSynced || activeIndex < 0 || isUserScrollingRef.current) {
      return
    }

    const scrollView = scrollViewRef.current
    if (!scrollView) {
      return
    }

    const activeId =
      doc.kind === "timed"
        ? doc.lines[activeIndex]?.id
        : doc.kind === "synced"
          ? doc.lines[activeIndex]?.id
          : undefined
    const viewportHeight = viewportHeightRef.current
    const key = `${mode}:${activeId ?? "none"}:${viewportHeight}`
    if (key === lastScrollKeyRef.current) {
      return
    }
    lastScrollKeyRef.current = key

    const measuredY = activeId ? offsetsRef.current[activeId] : undefined
    const anchorY = Math.max(28, viewportHeight * AUTO_SCROLL_ANCHOR_RATIO)
    const fallbackY = activeIndex * 52
    const targetY = Math.max(0, (measuredY ?? fallbackY) - anchorY)

    scrollView.scrollTo({ y: targetY, animated: true })
  }, [isSynced, mode, activeIndex, doc])

  return { scrollViewRef, setLineOffset, onUserScrollStart, onUserScrollEnd, setViewportHeight }
}
