/**
 * Purpose: Transitional facade from old player modules to the new playback store/actions.
 * Caller: Existing player service and control modules during playback rewrite.
 * Dependencies: playback store actions.
 * Main Functions: setupPlaybackCore(), playFromTracks(), pausePlayback(), resumePlayback(), nextTrack(), previousTrack(), seekPlayback(), setPlaybackRepeatMode().
 * Side Effects: Delegates to AudioBrowser-backed playback actions.
 */

import type { PlayerQueueContext, RepeatModeType, Track } from "@/modules/player/player.types"
import { PlaybackControls } from "@/stores/playback/actions"

export async function setupPlaybackCore() {
  await PlaybackControls.setupPlayback()
}

export function isPlaybackCoreSetUp() {
  return true
}

export async function playFromTracks(options: {
  track: Track
  tracks: Track[]
  context: PlayerQueueContext | null
  shuffle: boolean
}) {
  return await PlaybackControls.playFromTracks(options)
}

export async function pausePlayback() {
  await PlaybackControls.pause()
}

export async function resumePlayback() {
  await PlaybackControls.play()
}

export async function togglePlaybackCore() {
  await PlaybackControls.playToggle()
}

export async function nextTrack(naturalProgression = false) {
  await PlaybackControls.next(naturalProgression)
}

export async function previousTrack() {
  await PlaybackControls.prev()
}

export async function playQueueIndex(index: number) {
  await PlaybackControls.playAtIndex(index)
}

export async function seekPlayback(seconds: number) {
  await PlaybackControls.seekTo(seconds)
}

export async function setPlaybackRepeatMode(mode: RepeatModeType) {
  PlaybackControls.setRepeatMode(mode)
}
