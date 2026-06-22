import * as React from "react"
import { ScrollView } from "react-native"
import { scheduleLyricsAutoScroll } from "@/modules/lyrics/auto-scroll-runtime"

const AUTO_SCROLL_RESUME_DELAY_MS = 100

export function useLyricsAutoScroll({
  layoutCacheKey,
  effectiveMode,
  fontScale,
  activeSyncedLineIndex,
  activeLine,
  viewportHeight,
}: {
  layoutCacheKey: string
  effectiveMode: "static" | "synced" | "timedMarkup"
  fontScale: number
  activeSyncedLineIndex: number
  activeLine?: { id: string }
  viewportHeight: number
}) {
  const scrollViewRef = React.useRef<ScrollView | null>(null)
  const syncedLineOffsetRef = React.useRef<Record<string, number>>({})
  const isUserScrollingRef = React.useRef(false)
  const autoScrollResumeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

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

  React.useEffect(() => {
    const activeLineId = activeLine?.id
    scheduleLyricsAutoScroll({
      key: `${layoutCacheKey}:${activeLineId ?? "none"}:${viewportHeight}`,
      enabled:
        isSyncedMode &&
        activeSyncedLineIndex >= 0 &&
        viewportHeight > 0 &&
        !isUserScrollingRef.current,
      scrollView: scrollViewRef.current,
      measuredY: activeLineId ? syncedLineOffsetRef.current[activeLineId] : undefined,
      fallbackY: activeSyncedLineIndex * 52 * fontScale,
      viewportHeight,
    })
  }, [
    layoutCacheKey,
    activeLine,
    viewportHeight,
    isSyncedMode,
    activeSyncedLineIndex,
    fontScale,
  ])

  return {
    scrollViewRef,
    syncedLineOffsetRef,
    setSyncedLineOffset,
    handleUserScrollStart,
    handleUserScrollEnd,
  }
}
