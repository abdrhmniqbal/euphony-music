import AudioBrowser from "react-native-audio-browser"

import { queryClient } from "@/core/query/query-client"
import { addPlayedTrack } from "@/domains/tracks/repository"
import { TRACKS_KEY } from "@/domains/library/query-keys"
import { getPreferenceState } from "@/core/preferences/store"
import {
  handleCrossfadePlaybackState,
  handleCrossfadeProgress,
  handleCrossfadeTrackActivated,
} from "./crossfade"
import { pauseTrack, playNext, playPrevious, resumeTrack, seekTo } from "./controls"
import {
  evaluateSleepTimerOnProgress,
  handleSleepTimerPlaybackEnded,
  handleSleepTimerTrackChanged,
} from "./sleep-timer"
import { playbackStore, setPlaybackLastPosition } from "./playback-store"
import { toPlayerTrack } from "./player-track"
import { handleTrackChanged, handlePlaybackProgress } from "@/domains/lastfm/scrobbler"

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
  const currentTrackId = playbackStore.getState().activeTrack?.id ?? null

  handleSleepTimerTrackChanged(lastSleepTimerTrackId, currentTrackId)
  lastSleepTimerTrackId = currentTrackId
  void handleTrackChanged(toPlayerTrack(playbackStore.getState().activeTrack, getPreferenceState().splitMultipleValueConfig) ?? undefined)

  if (playCountTimeout !== null) clearTimeout(playCountTimeout)

  const { minimumSeconds } = getPreferenceState().countAsPlayedConfig
  const targetSeconds = Math.min(e.track.duration ?? minimumSeconds, minimumSeconds)

  playCountTimeout = setTimeout(async () => {
    const trackId = await addPlayedTrack(activeTrackUri)
    if (trackId) {
      await queryClient.invalidateQueries({ queryKey: [TRACKS_KEY] })
      await queryClient.invalidateQueries({ queryKey: ["history-recently-played"] })
      await queryClient.invalidateQueries({ queryKey: ["history-top-tracks"] })
    }
  }, targetSeconds * 1000)

  void handleCrossfadeTrackActivated()
}

function onProgressUpdated(e: { position: number; duration: number }) {
  if (e.duration === 0) return
  setPlaybackLastPosition(e.position)
  evaluateSleepTimerOnProgress(e.position, e.duration)
  void handlePlaybackProgress(e.position, e.duration)
  void handleCrossfadeProgress(e.position, e.duration)
}

type PlaybackState =
  | "none"
  | "ready"
  | "playing"
  | "paused"
  | "stopped"
  | "buffering"
  | "loading"
  | "ended"
  | "error"

const KNOWN_STATES = new Set<PlaybackState>([
  "none",
  "ready",
  "playing",
  "paused",
  "stopped",
  "buffering",
  "loading",
  "ended",
  "error",
])

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

  // SAFETY: state is checked against KNOWN_STATES in the same expression; foreign values fall back to "none"
  const state = e.state as PlaybackState
  void handleCrossfadePlaybackState(KNOWN_STATES.has(state) ? state : "none")
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
