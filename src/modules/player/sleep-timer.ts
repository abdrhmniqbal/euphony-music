/**
 * Purpose: Manages player sleep timer modes and stops playback when their conditions are met.
 * Caller: Player action sheet UI and player playback event handlers.
 * Dependencies: Player store, current-track selector, and playback pause controls.
 * Main Functions: setSleepTimerMinutes(), setSleepTimerPlayCount(), setSleepTimerTrackEnd(), setSleepTimerClock(), clearSleepTimer(), evaluateSleepTimerOnProgress(), handleSleepTimerTrackChanged()
 * Side Effects: Updates in-memory player sleep timer state and pauses playback when timer conditions are satisfied.
 */

import type { SleepTimerState } from "@/modules/player/types"
import { pauseTrack } from "@/modules/player/controls"

import {
  getCurrentTrackState,
  getDefaultSleepTimerState,
  getSleepTimerState,
  setSleepTimerState,
} from "./store"

const TRACK_END_EPSILON_SECONDS = 0.35

let isStoppingForSleepTimer = false

function resetSleepTimerState() {
  return {
    ...getDefaultSleepTimerState(),
  }
}

function buildNextClockTimestamp(hour: number, minute: number) {
  const now = new Date()
  const target = new Date(now)
  target.setHours(hour, minute, 0, 0)

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }

  return target.getTime()
}

async function stopPlaybackForSleepTimer() {
  if (isStoppingForSleepTimer) {
    return
  }

  isStoppingForSleepTimer = true
  clearSleepTimer()

  try {
    await pauseTrack()
  } finally {
    isStoppingForSleepTimer = false
  }
}

function updateSleepTimer(next: SleepTimerState) {
  setSleepTimerState(next)
}

export function clearSleepTimer() {
  updateSleepTimer(resetSleepTimerState())
}

export function setSleepTimerMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    clearSleepTimer()
    return
  }

  const roundedMinutes = Math.max(1, Math.round(minutes))
  updateSleepTimer({
    ...resetSleepTimerState(),
    mode: "minutes",
    minutes: roundedMinutes,
    targetTimestamp: Date.now() + roundedMinutes * 60 * 1000,
  })
}

export function setSleepTimerPlayCount(playCount: number) {
  if (!Number.isFinite(playCount) || playCount <= 0) {
    clearSleepTimer()
    return
  }

  updateSleepTimer({
    ...resetSleepTimerState(),
    mode: "playCount",
    playCount: Math.max(1, Math.round(playCount)),
  })
}

export function setSleepTimerTrackEnd() {
  const currentTrack = getCurrentTrackState()
  if (!currentTrack) {
    clearSleepTimer()
    return
  }

  updateSleepTimer({
    ...resetSleepTimerState(),
    mode: "trackEnd",
    targetTrackId: currentTrack.id,
  })
}

export function setSleepTimerClock(hour: number, minute: number) {
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    clearSleepTimer()
    return
  }

  const normalizedHour = Math.round(hour)
  const normalizedMinute = Math.round(minute)

  updateSleepTimer({
    ...resetSleepTimerState(),
    mode: "clock",
    clockHour: normalizedHour,
    clockMinute: normalizedMinute,
    targetTimestamp: buildNextClockTimestamp(normalizedHour, normalizedMinute),
  })
}

function shouldStopForTimestamp(state: SleepTimerState) {
  return Boolean(
    state.targetTimestamp && Date.now() >= state.targetTimestamp
  )
}

export function evaluateSleepTimerOnProgress(
  positionSeconds: number,
  durationSeconds: number
) {
  const state = getSleepTimerState()
  if (state.mode === "off") {
    return
  }

  if (
    (state.mode === "minutes" || state.mode === "clock") &&
    shouldStopForTimestamp(state)
  ) {
    void stopPlaybackForSleepTimer()
    return
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return
  }

  const currentTrack = getCurrentTrackState()
  if (!currentTrack) {
    return
  }

  const isNearTrackEnd =
    positionSeconds >= Math.max(durationSeconds - TRACK_END_EPSILON_SECONDS, 0)

  if (!isNearTrackEnd) {
    return
  }

  if (state.mode === "trackEnd" && currentTrack.id === state.targetTrackId) {
    void stopPlaybackForSleepTimer()
    return
  }

  if (state.mode !== "playCount") {
    return
  }

  if (state.lastCompletedTrackId === currentTrack.id) {
    return
  }

  const remainingPlayCount = state.playCount - 1
  if (remainingPlayCount <= 0) {
    void stopPlaybackForSleepTimer()
    return
  }

  updateSleepTimer({
    ...state,
    playCount: remainingPlayCount,
    lastCompletedTrackId: currentTrack.id,
  })
}

export function handleSleepTimerTrackChanged(
  previousTrackId: string | null,
  currentTrackId: string | null
) {
  const state = getSleepTimerState()
  if (state.mode === "off") {
    return
  }

  if (
    (state.mode === "minutes" || state.mode === "clock") &&
    shouldStopForTimestamp(state)
  ) {
    void stopPlaybackForSleepTimer()
    return
  }

  if (
    state.mode === "trackEnd" &&
    state.targetTrackId &&
    previousTrackId === state.targetTrackId &&
    currentTrackId !== state.targetTrackId
  ) {
    void stopPlaybackForSleepTimer()
  }
}
