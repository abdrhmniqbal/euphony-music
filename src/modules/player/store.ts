/**
 * Purpose: Stores playback state, queue state, and queue source context for player UI and controls.
 * Caller: player service, player selectors, player controls, and player UI blocks.
 * Dependencies: Zustand and player domain types.
 * Main Functions: usePlayerStore, setQueueContextState(), setQueueState(), setCurrentTrackState()
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

export function setIsPlayingState(value: boolean) {
  usePlayerStore.setState({ isPlaying: value })
}

export function setCurrentTimeState(value: number) {
  if (usePlayerStore.getState().currentTime === value) {
    return
  }

  usePlayerStore.setState({ currentTime: value })
}

export function getCurrentTimeState() {
  return usePlayerStore.getState().currentTime
}

export function setDurationState(value: number) {
  if (usePlayerStore.getState().duration === value) {
    return
  }

  usePlayerStore.setState({ duration: value })
}

export function getDurationState() {
  return usePlayerStore.getState().duration
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

export function setRepeatModeState(value: RepeatModeType) {
  usePlayerStore.setState({ repeatMode: value })
}

export function getQueueState() {
  return usePlayerStore.getState().queue
}

export function setQueueState(value: Track[]) {
  usePlayerStore.setState({ queue: value })
}

export function getQueueTrackIdsState() {
  return usePlayerStore.getState().queueTrackIds
}

export function setQueueTrackIdsState(value: string[]) {
  usePlayerStore.setState({ queueTrackIds: value })
}

export function getOriginalQueueState() {
  return usePlayerStore.getState().originalQueue
}

export function setOriginalQueueState(value: Track[]) {
  usePlayerStore.setState({ originalQueue: value })
}

export function getOriginalQueueTrackIdsState() {
  return usePlayerStore.getState().originalQueueTrackIds
}

export function setOriginalQueueTrackIdsState(value: string[]) {
  usePlayerStore.setState({ originalQueueTrackIds: value })
}

export function getImmediateQueueTrackIdsState() {
  return usePlayerStore.getState().immediateQueueTrackIds
}

export function setImmediateQueueTrackIdsState(value: string[]) {
  usePlayerStore.setState({ immediateQueueTrackIds: value })
}

export function getIsShuffledState() {
  return usePlayerStore.getState().isShuffled
}

export function setIsShuffledState(value: boolean) {
  usePlayerStore.setState({ isShuffled: value })
}

export function getQueueContextState() {
  return usePlayerStore.getState().queueContext
}

export function setQueueContextState(value: PlayerQueueContext | null) {
  usePlayerStore.setState({ queueContext: value })
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
