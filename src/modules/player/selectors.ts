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
import { usePlaybackStore } from "@/stores/playback/store"
import type { PlayerQueueContext } from "@/modules/player/types"

export function useCurrentTrack() {
  return usePlayerStore((state) => state.currentTrack)
}

export function useCurrentTrackId() {
  return usePlaybackStore((state) => state.activeTrack?.id)
}

export function useHasCurrentTrack() {
  return usePlaybackStore((state) => state.activeTrack !== undefined)
}

export function useIsPlaying() {
  return usePlaybackStore((state) => state.isPlaying)
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
  return usePlaybackStore((state) =>
    state.repeat === "no-repeat" ? "off" : state.repeat === "repeat" ? "queue" : "track"
  )
}

export function useIsShuffled() {
  return usePlaybackStore((state) => state.shuffle)
}

export function usePlayerTracks(): Track[] {
  return usePlayerStore((state) => state.tracks)
}

export function usePlayerQueue(): Track[] {
  return usePlayerStore((state) => state.queue)
}

export function usePlayerQueueContext() {
  return usePlaybackStore((state): PlayerQueueContext | null =>
    state.playingFrom ? { type: state.playingFrom.type, title: state.playingFromName } : null
  )
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
