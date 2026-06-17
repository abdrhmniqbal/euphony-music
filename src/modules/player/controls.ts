/**
 * Purpose: Provides playback control commands for pause, resume, seeking, queue navigation, and repeat mode.
 * Caller: playback UI controls, notification/remote events, bootstrap resume behavior, and lifecycle listeners.
 * Dependencies: AudioBrowser playback core, player session service, player store, audio playback settings, crossfade volume helpers, logging service.
 * Main Functions: pauseTrack(), resumeTrack(), togglePlayback(), playNext(), playPrevious(), seekTo(), setRepeatMode()
 * Side Effects: Mutates native playback state, updates player store, persists playback cursor/session state, and may change native volume.
 */

import type { RepeatModeType } from "@/modules/player/types"
import { isExtraLoggingEnabled, logError, logInfo, logWarn } from "@/modules/logging/service"
import {
  fadePlaybackVolumeIn,
  fadePlaybackVolumeOut,
  restorePlaybackVolume,
} from "@/modules/player/crossfade"
import { setPlaybackProgress } from "@/modules/player/runtime-state"
import { persistPlaybackSession } from "@/modules/player/session.service"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import {
  nextTrack,
  pausePlayback,
  playQueueIndex,
  previousTrack,
  resumePlayback,
  seekPlayback,
  setPlaybackRepeatMode,
  togglePlaybackCore,
} from "@/modules/player/playback-core"

import { getRepeatModeState, setIsPlayingState, setRepeatModeState, usePlayerStore } from "./store"

export async function pauseTrack() {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    logInfo("Pausing playback")
    if (audioPlaybackConfig.fadePlayPauseStop) {
      await fadePlaybackVolumeOut()
    }
    await pausePlayback()
    setIsPlayingState(false)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        isPlaying: false,
      },
    })
    logInfo("Playback paused")
  } catch (error) {
    logError("Failed to pause playback", error)
  }
}

export async function resumeTrack() {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    logInfo("Resuming playback")
    await resumePlayback()
    if (audioPlaybackConfig.fadePlayPauseStop) {
      await fadePlaybackVolumeIn()
    } else {
      await restorePlaybackVolume()
    }
    setIsPlayingState(true)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        isPlaying: true,
      },
    })
    logInfo("Playback resumed")
  } catch (error) {
    logError("Failed to resume playback", error)
  }
}

export async function togglePlayback() {
  try {
    logInfo("Toggling playback")
    await togglePlaybackCore()
  } catch (error) {
    logError("Failed to toggle playback", error)
  }
}

export async function playNext(naturalProgression = false) {
  try {
    logInfo(naturalProgression ? "Naturally progressing to next track" : "Skipping to next track")
    await nextTrack(naturalProgression)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      consumeImmediateQueue: true,
    })
    logInfo("Skipped to next track")
  } catch (error) {
    logWarn("Failed to skip to next track, falling back to queue restart", {
      error: error instanceof Error ? error.message : String(error),
    })
    logError("Failed next-track command", error)
  }
}

export async function skipToQueueItem(index: number) {
  try {
    logInfo("Skipping to specific track in queue", { index })
    await playQueueIndex(index)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      consumeImmediateQueue: true,
    })
    logInfo("Skipped to specific track in queue", { index })
  } catch (error) {
    logError("Failed to skip to specific track in queue", error, { index })
  }
}

export async function playPrevious() {
  try {
    logInfo("Playing previous track")
    await previousTrack()
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      consumeImmediateQueue: true,
    })
    logInfo("Played previous track")
  } catch (error) {
    logError("Failed to play previous track", error)
  }
}

export async function seekTo(seconds: number) {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    if (isExtraLoggingEnabled()) {
      logInfo("Seeking playback", { seconds })
    }
    const shouldFadeSeek = audioPlaybackConfig.fadeOnSeek

    if (shouldFadeSeek) {
      await fadePlaybackVolumeOut()
    }
    await seekPlayback(seconds)
    if (shouldFadeSeek) {
      await fadePlaybackVolumeIn()
    }
    setPlaybackProgress(seconds, usePlayerStore.getState().duration)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        positionSeconds: seconds,
      },
    })
    if (isExtraLoggingEnabled()) {
      logInfo("Playback seek completed", { seconds })
    }
  } catch (error) {
    logError("Failed to seek playback", error, { seconds })
  }
}

export async function setRepeatMode(mode: RepeatModeType) {
  try {
    logInfo("Updating repeat mode", { mode })
    await setPlaybackRepeatMode(mode)
    setRepeatModeState(mode)
    await persistPlaybackSession({
      force: true,
      cursorOnly: true,
      cursor: {
        repeatMode: mode,
      },
    })
    logInfo("Repeat mode updated", { mode })
  } catch (error) {
    logError("Failed to update repeat mode", error, { mode })
  }
}

export async function toggleRepeatMode() {
  const currentMode = getRepeatModeState()
  const nextMode: RepeatModeType =
    currentMode === "off" ? "track" : currentMode === "track" ? "queue" : "off"
  await setRepeatMode(nextMode)
}
