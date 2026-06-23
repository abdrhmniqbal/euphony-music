/**
 * Purpose: Stores playback state, queue state, and queue source context for player UI and controls.
 * Caller: player service, player selectors, player controls, and player UI blocks.
 * Dependencies: Zustand and player domain types.
 * Main Functions: usePlayerStore, getCurrentTrackState(), setTracksState(), setSleepTimerState()
 * Side Effects: Updates in-memory Zustand playback state.
 */

import type {
  Album,
  Artist,
  LyricLine,
  PlayerQueueContext,
  RepeatModeType,
  SleepTimerState,
  Track,
} from "./types"
import { create } from "zustand"

export type { Album, Artist, LyricLine, RepeatModeType, Track }

export interface PlayerState {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRefreshVersion: number
  repeatMode: RepeatModeType
  queueTrackIds: string[]
  originalQueueTrackIds: string[]
  immediateQueueTrackIds: string[]
  queue: Track[]
  originalQueue: Track[]
  isShuffled: boolean
  queueContext: PlayerQueueContext | null
  sleepTimer: SleepTimerState
}

const DEFAULT_SLEEP_TIMER_STATE: SleepTimerState = {
  mode: "off",
  minutes: 0,
  playCount: 0,
  targetTrackId: null,
  targetTimestamp: null,
  clockHour: null,
  clockMinute: null,
  lastCompletedTrackId: null,
}

export const usePlayerStore = create<PlayerState>(() => ({
  tracks: [],
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRefreshVersion: 0,
  repeatMode: "off",
  queueTrackIds: [],
  originalQueueTrackIds: [],
  immediateQueueTrackIds: [],
  queue: [],
  originalQueue: [],
  isShuffled: false,
  queueContext: null,
  sleepTimer: DEFAULT_SLEEP_TIMER_STATE,
}))

export function getTracksState() {
  return usePlayerStore.getState().tracks
}

export function setTracksState(value: Track[]) {
  usePlayerStore.setState({ tracks: value })
}

export function getCurrentTrackState() {
  return usePlayerStore.getState().currentTrack
}

export function setCurrentTrackState(value: Track | null) {
  usePlayerStore.setState({ currentTrack: value })
}

export function getIsPlayingState() {
  return usePlayerStore.getState().isPlaying
}

export function setDurationState(value: number) {
  if (usePlayerStore.getState().duration === value) {
    return
  }

  usePlayerStore.setState({ duration: value })
}

export function setPlaybackRefreshVersionState(value: number) {
  usePlayerStore.setState({ playbackRefreshVersion: value })
}

export function getPlaybackRefreshVersionState() {
  return usePlayerStore.getState().playbackRefreshVersion
}

export function getRepeatModeState() {
  return usePlayerStore.getState().repeatMode
}

export function getQueueTrackIdsState() {
  return usePlayerStore.getState().queueTrackIds
}

export function getIsShuffledState() {
  return usePlayerStore.getState().isShuffled
}

export function getSleepTimerState() {
  return usePlayerStore.getState().sleepTimer
}

export function setSleepTimerState(value: SleepTimerState) {
  usePlayerStore.setState({ sleepTimer: value })
}

export function getDefaultSleepTimerState() {
  return DEFAULT_SLEEP_TIMER_STATE
}
