/**
 * Purpose: Controls when playback activity should be recorded in history and play count metrics.
 * Caller: AudioBrowser playback actions.
 * Dependencies: history cache service, history repository writes, player store current-track state.
 * Main Functions: handleTrackActivated(), handleTrackProgress()
 * Side Effects: Writes indexed tracks to play history and play count after the configured threshold playback; invalidates history-related queries.
 */

import { queryClient } from "@/lib/tanstack-query"
import { EXTERNAL_TRACK_ID_PREFIX, type Track } from "@/modules/player/types"
import {
  invalidateHistoryAfterPlayback,
  optimisticallyUpdateRecentlyPlayedHistory,
} from "@/modules/history/cache-service"
import { addTrackToHistory, incrementTrackPlayCount } from "@/modules/history/repository"
import { getSettingsState } from "@/modules/settings/store"

import {
  getCurrentTrackState,
  getPlaybackRefreshVersionState,
  setPlaybackRefreshVersionState,
} from "./store"

let pendingTrackId: string | null = null
let hasRecordedPendingTrack = false

function bumpPlaybackRefreshVersion() {
  setPlaybackRefreshVersionState(getPlaybackRefreshVersionState() + 1)
}

function isExternalTrack(track: Track) {
  return track.isExternal === true || track.id.startsWith(EXTERNAL_TRACK_ID_PREFIX)
}

async function recordQualifiedTrackPlayback(track: Track) {
  optimisticallyUpdateRecentlyPlayedHistory(queryClient, track)
  await Promise.allSettled([addTrackToHistory(track.id), incrementTrackPlayCount(track.id)])
  bumpPlaybackRefreshVersion()
  void invalidateHistoryAfterPlayback(queryClient)
}

export function handleTrackActivated(track: Track) {
  pendingTrackId = track.id
  hasRecordedPendingTrack = false
}

function handleTrackProgress(positionSeconds: number, durationSeconds: number) {
  if (!pendingTrackId || hasRecordedPendingTrack) {
    return
  }

  const currentTrack = getCurrentTrackState()
  if (!currentTrack || currentTrack.id !== pendingTrackId) {
    return
  }

  if (isExternalTrack(currentTrack)) {
    hasRecordedPendingTrack = true
    return
  }

  const resolvedDuration = Math.max(durationSeconds, currentTrack.duration || 0)
  if (!Number.isFinite(resolvedDuration) || resolvedDuration <= 0) {
    return
  }

  const minimumPlayedRatio = getSettingsState().countAsPlayedConfig.minimumPlayedPercent / 100
  const minimumPlayedSeconds = resolvedDuration * minimumPlayedRatio
  if (positionSeconds < minimumPlayedSeconds) {
    return
  }

  hasRecordedPendingTrack = true
  void recordQualifiedTrackPlayback(currentTrack)
}
