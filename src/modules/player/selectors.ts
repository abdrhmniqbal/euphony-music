/**
 * Purpose: Exposes focused player store selectors for playback state, queue data, and queue context.
 * Caller: player route, player controls, queue view, mini player, and playback UI blocks.
 * Dependencies: player store and React memo utilities.
 * Main Functions: useCurrentTrack(), usePlayerQueueInfo(), usePlayerQueueContext()
 * Side Effects: None.
 */

import { useMemo } from "react"
import { usePolledProgress } from "react-native-audio-browser"

import { type RepeatModeType, type Track, usePlayerStore } from "./store"

export function useCurrentTrack() {
  return usePlayerStore((state) => state.currentTrack)
}

export function useCurrentTrackId() {
  return usePlayerStore((state) => state.currentTrack?.id)
}

export function useHasCurrentTrack() {
  return usePlayerStore((state) => state.currentTrack !== null)
}

export function useIsPlaying() {
  return usePlayerStore((state) => state.isPlaying)
}

export function usePlaybackCurrentTime() {
  return usePolledProgress().position
}

export function usePlaybackDuration() {
  return usePolledProgress().duration
}

export function usePlaybackProgressState() {
  const { position: currentTime, duration } = usePolledProgress()
  return { currentTime, duration }
}

export function usePlaybackRepeatMode(): RepeatModeType {
  return usePlayerStore((state) => state.repeatMode)
}

export function useIsShuffled() {
  return usePlayerStore((state) => state.isShuffled)
}

export function usePlayerTracks(): Track[] {
  return usePlayerStore((state) => state.tracks)
}

export function usePlayerQueue(): Track[] {
  return usePlayerStore((state) => state.queue)
}

export function usePlayerQueueContext() {
  return usePlayerStore((state) => state.queueContext)
}

export function useSleepTimerState() {
  return usePlayerStore((state) => state.sleepTimer)
}

export function usePlayerQueueInfo() {
  const queue = usePlayerQueue()
  const currentTrackId = useCurrentTrackId()

  return useMemo(() => {
    const currentIndex = currentTrackId
      ? queue.findIndex((track) => track.id === currentTrackId)
      : -1

    return {
      queue,
      currentIndex,
      currentTrackId: currentTrackId ?? null,
      upNext: currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue,
    }
  }, [currentTrackId, queue])
}
