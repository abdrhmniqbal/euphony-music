import { create } from "zustand"
import { useStore } from "zustand"

import type { PlaybackQueueContext, PlayerTrack, RepeatModeType, SleepTimerState } from "./types"

export interface PlayerState {
  tracks: PlayerTrack[]
  currentTrack: PlayerTrack | null
  isPlaying: boolean
  repeatMode: RepeatModeType
  queueTrackIds: string[]
  originalQueueTrackIds: string[]
  isShuffled: boolean
  queueContext: PlaybackQueueContext | null
  sleepTimer: SleepTimerState
}

export const DEFAULT_SLEEP_TIMER_STATE: SleepTimerState = {
  mode: "off",
  minutes: 0,
  playCount: 0,
  targetTrackId: null,
  targetTimestamp: null,
  clockHour: null,
  clockMinute: null,
  lastCompletedTrackId: null,
}

export const playerStore = create<PlayerState>(() => ({
  tracks: [],
  currentTrack: null,
  isPlaying: false,
  repeatMode: "off",
  queueTrackIds: [],
  originalQueueTrackIds: [],
  isShuffled: false,
  queueContext: null,
  sleepTimer: DEFAULT_SLEEP_TIMER_STATE,
}))

export function usePlayerStore<T>(selector: (state: PlayerState) => T): T {
  return useStore(playerStore, selector)
}

export function getTracksState() {
  return playerStore.getState().tracks
}

export function setTracksState(value: PlayerTrack[]) {
  playerStore.setState({ tracks: value })
}

export function getCurrentTrackState() {
  return playerStore.getState().currentTrack
}

export function getRepeatModeState() {
  return playerStore.getState().repeatMode
}

export function getQueueTrackIdsState() {
  return playerStore.getState().queueTrackIds
}

export function getIsShuffledState() {
  return playerStore.getState().isShuffled
}

export function getSleepTimerState() {
  return playerStore.getState().sleepTimer
}

export function setSleepTimerState(value: SleepTimerState) {
  playerStore.setState({ sleepTimer: value })
}
