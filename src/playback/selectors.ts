import { useMemo } from "react"
import { usePolledProgress } from "react-native-audio-browser"
import { useStore } from "zustand"

import { extractTrackId, playbackStore } from "./playback-store"
import { playerStore } from "./player-store"
import type { RepeatModeType } from "./types"

export function useCurrentTrack() {
  return useStore(playerStore, (state) => state.currentTrack)
}

export function useCurrentTrackId() {
  return useStore(playbackStore, (state) => state.activeTrack?.id)
}

function useCurrentTrackKey() {
  return useStore(playbackStore, (state) => state.activeKey)
}

export function useHasCurrentTrack(): boolean {
  return useStore(playbackStore, (state) => state.activeTrack !== undefined)
}

export function useIsPlaying() {
  return useStore(playbackStore, (state) => state.isPlaying)
}

export function usePlaybackProgressState() {
  const { position: currentTime, duration } = usePolledProgress()
  return { currentTime, duration }
}

export function usePlaybackRepeatMode(): RepeatModeType {
  return useStore(playbackStore, (state) =>
    state.repeat === "no-repeat" ? "off" : state.repeat === "repeat" ? "queue" : "track"
  )
}

export function useIsShuffled() {
  return useStore(playbackStore, (state) => state.shuffle)
}

export function usePlayerTracks() {
  return useStore(playerStore, (state) => state.tracks)
}

// Selects the resolved queue track for a single key from the in-memory
// projector `tracks`. Per-row subscription means a row only re-renders when its
// own track object changes (once per queue load), not on every playback tick.
export function usePlayerTrackByKey(trackKey: string) {
  const id = extractTrackId(trackKey)
  return useStore(playerStore, (state) => state.tracks.find((t) => t.id === id) ?? null)
}

export function usePlayerQueue(): string[] {
  return useStore(playbackStore, (state) => state.queue)
}

export function usePlayerQueueContext() {
  return useStore(
    playbackStore,
    (state): import("./types").PlaybackQueueContext | null => state.queueContext
  )
}

export function useSleepTimerState() {
  return useStore(playerStore, (state) => state.sleepTimer)
}

export function usePlayerQueueInfo() {
  const queue = usePlayerQueue()
  const currentIndex = useStore(playbackStore, (state) => state.queuePosition)
  const currentTrackKey = useCurrentTrackKey()

  return useMemo(() => {
    return {
      queue,
      currentIndex,
      currentTrackKey: currentTrackKey ?? null,
      upNext: currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue,
    }
  }, [currentTrackKey, queue, currentIndex])
}
