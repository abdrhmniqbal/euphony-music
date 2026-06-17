/**
 * Purpose: Provides pure comparison and dedupe helpers for playback session sync.
 * Caller: Player session service.
 * Dependencies: Player track type.
 * Main Functions: dedupeTrackIds(), areStringArraysEqual(), areTracksPresentationEqual()
 * Side Effects: None.
 */

import type { Track } from "@/modules/player/types"

export function dedupeTrackIds(trackIds: string[]) {
  return trackIds.filter((trackId, index) => trackIds.indexOf(trackId) === index)
}

export function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

export function areTracksPresentationEqual(
  left: Track | null,
  right: Track | null
) {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return left === right
  }

  return (
    left.id === right.id &&
    left.uri === right.uri &&
    left.duration === right.duration &&
    left.image === right.image &&
    left.title === right.title &&
    left.artist === right.artist &&
    left.album === right.album
  )
}
