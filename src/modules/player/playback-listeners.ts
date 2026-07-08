import AudioBrowser from "react-native-audio-browser"

import { addPlayedTrack } from "@/modules/tracks/repository"
import { queryClient } from "@/lib/tanstack-query"
import { invalidateTrackQueries } from "@/modules/tracks/keys"
import {
  handleCrossfadePlaybackState,
  handleCrossfadeProgress,
  handleCrossfadeTrackActivated,
} from "@/modules/player/crossfade"
import { pauseTrack, playNext, playPrevious, resumeTrack, seekTo } from "@/modules/player/controls"
import {
  handlePlaybackProgress,
  handleTrackChanged as handleLastFmTrackChanged,
} from "@/modules/player/lastfm-scrobbler"
import {
  evaluateSleepTimerOnProgress,
  handleSleepTimerPlaybackEnded,
  handleSleepTimerTrackChanged,
} from "@/modules/player/sleep-timer"
import { preferenceStore } from "@/stores/preference/store"
import { playbackStore, setPlaybackLastPosition } from "@/stores/playback/store"

let playCountTimeout: ReturnType<typeof setTimeout> | null = null
let lastAutoAdvanceAt = 0
let lastSleepTimerTrackId: string | null = null
let playbackListenersRegistered = false

function advanceToNextTrackOnce() {
  const now = Date.now()
  if (now - lastAutoAdvanceAt < 1000) {
    return
  }

  lastAutoAdvanceAt = now
  void playNext(true)
}

function onActiveTrackChanged(e: {
  index?: number
  track?: { src?: string; duration?: number } | null
}) {
  if (e.index === undefined || e.track?.src === undefined) return
  const activeTrackUri = decodeURIComponent(e.track.src)
  const currentTrack = playbackStore.getState().activeTrack ?? undefined
  const currentTrackId = currentTrack?.id ?? null
  handleSleepTimerTrackChanged(lastSleepTimerTrackId, currentTrackId)
  lastSleepTimerTrackId = currentTrackId
  void handleLastFmTrackChanged(currentTrack)

  if (playCountTimeout !== null) clearTimeout(playCountTimeout)

  const { minSeconds } = preferenceStore.getState()
  const targetSeconds = Math.min(e.track.duration ?? minSeconds, minSeconds)

  playCountTimeout = setTimeout(async () => {
    const trackId = await addPlayedTrack(activeTrackUri)
    if (trackId) {
      await invalidateTrackQueries(queryClient, { trackId })
      await queryClient.invalidateQueries({
        queryKey: ["history-recently-played"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["history-top-tracks"],
      })
    }
  }, targetSeconds * 1000)

  void handleCrossfadeTrackActivated()
}

function onProgressUpdated(e: { position: number; duration: number }) {
  if (e.duration === 0) return
  setPlaybackLastPosition(e.position)
  const activeTrack = playbackStore.getState().activeTrack ?? undefined
  evaluateSleepTimerOnProgress(e.position, e.duration)
  void handleLastFmTrackChanged(activeTrack)
  void handlePlaybackProgress(e.position, e.duration)
  void handleCrossfadeProgress(e.position, e.duration)
}

function toPlaybackState(state: string) {
  switch (state) {
    case "none":
    case "ready":
    case "playing":
    case "paused":
    case "stopped":
    case "buffering":
    case "loading":
    case "ended":
    case "error":
      return state
    default:
      return "none"
  }
}

function onPlaybackChanged(e: { state: string }) {
  if (e.state === "paused") {
    playbackStore.setState({ isPlaying: false })
  } else if (e.state === "ended") {
    const currentTrackId = playbackStore.getState().activeTrack?.id ?? null
    void handleSleepTimerPlaybackEnded(currentTrackId).then((hasStopped) => {
      if (!hasStopped) {
        advanceToNextTrackOnce()
      }
    })
  }

  void handleCrossfadePlaybackState(toPlaybackState(e.state))
}

export function registerPlaybackListeners() {
  if (playbackListenersRegistered) {
    return
  }

  AudioBrowser.handleRemotePlay(() => {
    void resumeTrack()
  })
  AudioBrowser.handleRemotePause(() => {
    void pauseTrack()
  })
  AudioBrowser.handleRemoteNext(() => {
    void playNext()
  })
  AudioBrowser.handleRemotePrevious(() => {
    void playPrevious()
  })
  AudioBrowser.handleRemoteSeek((e: { position: number }) => {
    void seekTo(e.position)
  })

  AudioBrowser.onActiveTrackChanged.addListener(onActiveTrackChanged)
  AudioBrowser.onProgressUpdated.addListener(onProgressUpdated)
  AudioBrowser.onPlaybackChanged.addListener(onPlaybackChanged)
  playbackListenersRegistered = true
}
