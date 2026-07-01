/**
 * Purpose: Applies saved audio crossfade and short playback volume transition preferences to native playback volume.
 * Caller: Player event service progress, active-track, playback-state, queue-ended handlers, and player controls.
 * Dependencies: AudioBrowser native module, settings crossfade config loader, settings store, player queue state, logging service.
 * Main Functions: handleCrossfadeProgress(), handleCrossfadeTrackActivated(), handleCrossfadePlaybackState(), handleCrossfadePlaybackStopped(), resetCrossfadeVolume(), fadePlaybackVolumeIn(), fadePlaybackVolumeOut(), duckPlaybackVolume(), restorePlaybackVolume()
 * Side Effects: Reads local settings and updates native AudioBrowser volume.
 */

import { logError } from "@/modules/logging/service"
import { ensureCrossfadeConfigLoaded } from "@/modules/settings/audio-crossfade"
import { getSettingsState } from "@/modules/settings/store"
import AudioBrowser from "react-native-audio-browser"

import { getCurrentTrackState, getQueueTrackIdsState, getRepeatModeState } from "./store"
import {
  FULL_VOLUME,
  MIN_FADE_SECONDS,
  SILENT_VOLUME,
  clampVolume,
  easeInOutCubic,
  getFadeDurationSeconds,
} from "./crossfade-math"

type PlaybackState =
  | "none"
  | "ready"
  | "playing"
  | "paused"
  | "stopped"
  | "ended"
  | "error"
  | "loading"
  | "buffering"

const RESET_VOLUME_STATES = new Set<PlaybackState>(["paused", "stopped", "ended", "none", "error"])
const DUCKED_VOLUME = 0.25
const SHORT_FADE_SECONDS = 0.2
const FADE_STEP_MS = 50

let volumeRampTimer: ReturnType<typeof setInterval> | null = null
let activeRampId = 0
let activeRampResolve: (() => void) | null = null
let fadingOutTrackId: string | null = null
let shouldFadeInNextTrack = false

function clearVolumeRamp() {
  activeRampId += 1

  if (volumeRampTimer) {
    clearInterval(volumeRampTimer)
    volumeRampTimer = null
  }

  activeRampResolve?.()
  activeRampResolve = null
}

let currentVolume = 1

async function setPlayerVolume(value: number) {
  currentVolume = clampVolume(value)
  AudioBrowser.setVolume(currentVolume)
}

async function startVolumeRamp(toVolume: number, durationSeconds: number) {
  clearVolumeRamp()

  const rampId = activeRampId
  const fromVolume = currentVolume
  const targetVolume = clampVolume(toVolume)
  const durationMs = Math.max(1, durationSeconds * 1000)
  const startedAt = Date.now()

  if (durationMs <= FADE_STEP_MS) {
    await setPlayerVolume(targetVolume)
    return
  }

  return new Promise<void>((resolve) => {
    activeRampResolve = resolve
    volumeRampTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / durationMs)
      const easedProgress = easeInOutCubic(progress)
      const nextVolume = fromVolume + (targetVolume - fromVolume) * easedProgress

      void setPlayerVolume(nextVolume).catch((error) => {
        clearVolumeRamp()
        logError("Failed to update crossfade volume", error)
      })

      if (progress >= 1 && rampId === activeRampId) {
        clearVolumeRamp()
      }
    }, FADE_STEP_MS)
  })
}

function hasNextQueueTrack() {
  const currentTrack = getCurrentTrackState()
  const queueTrackIds = getQueueTrackIdsState()

  if (!currentTrack || queueTrackIds.length <= 1) {
    return false
  }

  const currentIndex = queueTrackIds.indexOf(currentTrack.id)
  if (currentIndex < 0) {
    return false
  }

  if (currentIndex < queueTrackIds.length - 1) {
    return true
  }

  return getRepeatModeState() === "queue"
}

export async function resetCrossfadeVolume() {
  try {
    clearVolumeRamp()
    fadingOutTrackId = null
    shouldFadeInNextTrack = false
    await setPlayerVolume(FULL_VOLUME)
  } catch (error) {
    logError("Failed to reset crossfade volume", error)
  }
}

export async function fadePlaybackVolumeIn(durationSeconds = SHORT_FADE_SECONDS) {
  try {
    await setPlayerVolume(SILENT_VOLUME)
    await startVolumeRamp(FULL_VOLUME, durationSeconds)
  } catch (error) {
    logError("Failed to fade playback volume in", error)
  }
}

export async function fadePlaybackVolumeOut(durationSeconds = SHORT_FADE_SECONDS) {
  try {
    await startVolumeRamp(SILENT_VOLUME, durationSeconds)
  } catch (error) {
    logError("Failed to fade playback volume out", error)
  }
}

async function duckPlaybackVolume() {
  try {
    await startVolumeRamp(DUCKED_VOLUME, SHORT_FADE_SECONDS)
  } catch (error) {
    logError("Failed to duck playback volume", error)
  }
}

export async function restorePlaybackVolume() {
  try {
    await startVolumeRamp(FULL_VOLUME, SHORT_FADE_SECONDS)
  } catch (error) {
    logError("Failed to restore playback volume", error)
  }
}

export async function handleCrossfadeProgress(position: number, duration: number) {
  try {
    await ensureCrossfadeConfigLoaded()
    const config = getSettingsState().crossfadeConfig

    if (!config.isEnabled || config.durationSeconds <= 0) {
      if (volumeRampTimer || fadingOutTrackId || shouldFadeInNextTrack) {
        await resetCrossfadeVolume()
      }
      return
    }

    const currentTrack = getCurrentTrackState()
    if (!currentTrack || !hasNextQueueTrack()) {
      if (fadingOutTrackId || shouldFadeInNextTrack) {
        await resetCrossfadeVolume()
      }
      return
    }

    const fadeDurationSeconds = getFadeDurationSeconds(duration, config.durationSeconds)
    const remainingSeconds = duration - position

    if (
      !Number.isFinite(remainingSeconds) ||
      remainingSeconds <= 0 ||
      remainingSeconds > fadeDurationSeconds ||
      fadingOutTrackId === currentTrack.id
    ) {
      return
    }

    fadingOutTrackId = currentTrack.id
    shouldFadeInNextTrack = true
    await startVolumeRamp(SILENT_VOLUME, Math.max(MIN_FADE_SECONDS, remainingSeconds))
  } catch (error) {
    logError("Failed to handle crossfade progress", error)
  }
}

export async function handleCrossfadeTrackActivated() {
  try {
    await ensureCrossfadeConfigLoaded()
    const config = getSettingsState().crossfadeConfig

    clearVolumeRamp()
    fadingOutTrackId = null

    if (!config.isEnabled || !shouldFadeInNextTrack) {
      shouldFadeInNextTrack = false
      await setPlayerVolume(FULL_VOLUME)
      return
    }

    shouldFadeInNextTrack = false
    await setPlayerVolume(SILENT_VOLUME)
    await startVolumeRamp(FULL_VOLUME, config.durationSeconds)
  } catch (error) {
    logError("Failed to handle crossfade track activation", error)
  }
}

export async function handleCrossfadePlaybackState(state: PlaybackState) {
  if (RESET_VOLUME_STATES.has(state)) {
    await resetCrossfadeVolume()
  }
}

async function handleCrossfadePlaybackStopped() {
  await resetCrossfadeVolume()
}
