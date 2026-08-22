import { logError, logInfo } from "@/core/log/service"
import { getPreferenceState } from "@/core/preferences/store"

import { fadePlaybackVolumeIn, fadePlaybackVolumeOut, restorePlaybackVolume } from "./crossfade"
import { getRepeatModeState } from "./player-store"
import {
  next as nextTrack,
  pause,
  play,
  playAtIndex,
  playToggle,
  prev as previousTrack,
  seekTo as seekPlayback,
} from "./actions/controls"
import { setRepeat } from "./actions/settings"
import type { RepeatModeType } from "./types"

function toPlaybackRepeatMode(mode: RepeatModeType): "no-repeat" | "repeat" | "repeat-one" {
  if (mode === "queue") return "repeat"
  if (mode === "track") return "repeat-one"
  return "no-repeat"
}

export async function pauseTrack() {
  try {
    const { fadePlayPauseStop } = getPreferenceState().audioPlaybackConfig
    logInfo("Pausing playback")
    if (fadePlayPauseStop) {
      await fadePlaybackVolumeOut()
    }
    await pause()
    logInfo("Playback paused")
  } catch (error) {
    logError("Failed to pause playback", error)
  }
}

export async function resumeTrack() {
  try {
    const { fadePlayPauseStop } = getPreferenceState().audioPlaybackConfig
    logInfo("Resuming playback")
    await play()
    if (fadePlayPauseStop) {
      await fadePlaybackVolumeIn()
    } else {
      await restorePlaybackVolume()
    }
    logInfo("Playback resumed")
  } catch (error) {
    logError("Failed to resume playback", error)
  }
}

export async function togglePlayback() {
  try {
    logInfo("Toggling playback")
    await playToggle()
  } catch (error) {
    logError("Failed to toggle playback", error)
  }
}

export async function playNext(naturalProgression = false) {
  try {
    logInfo(naturalProgression ? "Naturally progressing to next track" : "Skipping to next track")
    await nextTrack(naturalProgression)
    logInfo("Skipped to next track")
  } catch (error) {
    logError("Failed to skip to next track", error)
  }
}

export async function skipToQueueItem(index: number) {
  try {
    logInfo("Skipping to specific track in queue", { index })
    await playAtIndex(index)
  } catch (error) {
    logError("Failed to skip to specific track in queue", error, { index })
  }
}

export async function playPrevious() {
  try {
    logInfo("Playing previous track")
    await previousTrack()
  } catch (error) {
    logError("Failed to play previous track", error)
  }
}

export async function seekTo(seconds: number) {
  try {
    const { fadeOnSeek } = getPreferenceState().audioPlaybackConfig

    if (fadeOnSeek) {
      await fadePlaybackVolumeOut()
    }
    await seekPlayback(seconds)
    if (fadeOnSeek) {
      await fadePlaybackVolumeIn()
    }
  } catch (error) {
    logError("Failed to seek playback", error, { seconds })
  }
}

async function applyRepeatMode(mode: RepeatModeType) {
  try {
    logInfo("Updating repeat mode", { mode })
    await setRepeat(toPlaybackRepeatMode(mode))
    logInfo("Repeat mode updated", { mode })
  } catch (error) {
    logError("Failed to update repeat mode", error, { mode })
  }
}

export async function toggleRepeatMode() {
  const currentMode = getRepeatModeState()
  const nextMode: RepeatModeType =
    currentMode === "off" ? "track" : currentMode === "track" ? "queue" : "off"
  await applyRepeatMode(nextMode)
}
