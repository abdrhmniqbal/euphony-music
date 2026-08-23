import { useStore } from "zustand"

import { extractTrackId } from "./playback-store"
import { playerStore } from "./player-store"

export function useCurrentTrack() {
  return useStore(playerStore, (state) => state.currentTrack)
}

export function useIsPlaying() {
  return useStore(playerStore, (state) => state.isPlaying)
}

export function usePlayerTracks() {
  return useStore(playerStore, (state) => state.tracks)
}

export function useCurrentTrackId(): string | null {
  return useStore(playerStore, (state) => state.currentTrack?.id ?? null)
}

export function useHasCurrentTrack(): boolean {
  return useStore(playerStore, (state) => state.currentTrack !== null)
}

export function getCurrentPlaybackState() {
  return playerStore.getState()
}

export function getCurrentTrackIdSync(): string | null {
  return playerStore.getState().currentTrack?.id ?? null
}

export function getQueueKeysSync(): string[] {
  return playerStore.getState().queueTrackIds.map(extractTrackId)
}
