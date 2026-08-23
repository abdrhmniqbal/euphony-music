import { useCallback } from "react"

import type { PlaybackQueueContext, PlayerTrack } from "@/playback/types"
import { playTrack } from "@/playback/service"
import { createPlaybackQueueContext } from "@/playback/types"

export function usePlaybackActions(tracks: PlayerTrack[], contextTitle: string, contextType: PlaybackQueueContext["type"]) {
  const playAll = useCallback(() => {
    if (tracks.length === 0) return
    void playTrack(tracks[0], tracks, createPlaybackQueueContext(contextType, contextTitle))
  }, [tracks, contextTitle, contextType])

  const shuffle = useCallback(() => {
    if (tracks.length === 0) return
    const randomIndex = Math.floor(Math.random() * tracks.length)
    void playTrack(
      tracks[randomIndex],
      tracks,
      createPlaybackQueueContext(contextType, contextTitle)
    )
  }, [tracks, contextTitle, contextType])

  return { playAll, shuffle }
}

export function decodeRouteParam(raw: string | undefined): { value: string; raw: string; decodeFailed: boolean } {
  const value = raw ?? ""
  try {
    return { value: decodeURIComponent(value), raw: value, decodeFailed: false }
  } catch {
    return { value, raw: value, decodeFailed: true }
  }
}
