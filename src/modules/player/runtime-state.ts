import { updateColorsForImage } from "@/modules/player/colors"
import type { Track } from "@/modules/player/types"

import { setCurrentTrackState, setDurationState, usePlayerStore } from "./store"

let lastProgressPosition = 0
let lastProgressDuration = 0

export function setActiveTrack(track: Track | null) {
  setCurrentTrackState(track)
  setDurationState(track?.duration || 0)
  void updateColorsForImage(track?.image)
}

export function setPlaybackProgress(position: number, duration: number) {
  const nextPosition = Number.isFinite(position) ? Math.max(0, position) : 0
  const nextDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0

  if (
    Math.abs(lastProgressPosition - nextPosition) < 0.01 &&
    Math.abs(lastProgressDuration - nextDuration) < 0.01
  ) {
    return
  }

  lastProgressPosition = nextPosition
  lastProgressDuration = nextDuration
  usePlayerStore.setState({
    currentTime: nextPosition,
    duration: nextDuration,
  })
}
