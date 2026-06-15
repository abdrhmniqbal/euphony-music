/**
 * Purpose: Provides reference-style playback queue/source helpers.
 * Caller: Playback actions.
 * Dependencies: player domain types.
 * Main Functions: extractTrackId(), arePlaybackSourceEqual(), getUpdatedLists(), shuffleArray().
 * Side Effects: None.
 */

import type { Track } from "@/modules/player/player.types"
import type { PlayFromSource } from "./types"

export function arePlaybackSourceEqual(
  sourceA: PlayFromSource | undefined,
  sourceB: PlayFromSource
) {
  return sourceA?.type === sourceB.type && sourceA.id === sourceB.id
}

export function extractTrackId(key: string) {
  return key.split("__")[0] || key
}

export function shuffleArray<T>(items: T[]) {
  const shuffledItems = [...items]
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffledItems[index], shuffledItems[swapIndex]] = [
      shuffledItems[swapIndex],
      shuffledItems[index],
    ]
  }

  return shuffledItems
}

export function getUpdatedLists(
  trackIds: string[],
  shuffle: boolean,
  startTrackId?: string
) {
  const usedList = shuffle ? shuffleArray(trackIds) : trackIds
  const startIndex =
    startTrackId !== undefined
      ? usedList.findIndex((trackId) => extractTrackId(trackId) === startTrackId)
      : -1

  return {
    orderSnapshot: trackIds,
    queue: startIndex > 0
      ? [...usedList.slice(startIndex), ...usedList.slice(0, startIndex)]
      : usedList,
    queuePosition: 0,
    numQueuedNext: 0,
  }
}

export function getTrackLookup(tracks: Track[]) {
  return new Map(tracks.map((track) => [track.id, track]))
}
