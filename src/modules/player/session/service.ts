/**
 * Purpose: Persists, restores, and synchronizes playback queue, cursor, and source context state.
 * Caller: bootstrap runtime, player service, playback controls, and foreground sync handlers.
 * Dependencies: player session repository, TrackPlayer adapter, player store, runtime services, and player colors service.
 * Main Functions: persistPlaybackSession(), restorePlaybackSession(), syncPlaybackSessionFromPlayer(), ensureNativePlaybackQueue()
 * Side Effects: Reads/writes playback snapshot files, syncs native playback queue, and updates player Zustand state.
 */

import type { PlayerQueueContext, Track } from "@/modules/player/types"
import type { RepeatMode } from "@/modules/player/utils"
import type {
  NativePlaybackStatusSnapshot,
  NativeQueue,
  NativeTrack,
  PersistPlaybackSessionOptions,
  ResolvedPlaybackSession,
  SyncCurrentTrackOptions,
} from "./types"
import {
  MAX_TRACKMAP_SIZE,
  MIN_SESSION_SAVE_INTERVAL_MS,
  PLAYBACK_POSITION_EPSILON,
  TRACKMAP_ACTIVE_WINDOW,
} from "./types"
import { logError, logInfo } from "@/modules/logging/service"
import { measurePerfTrace } from "@/modules/logging/perf-trace"
import { updateColorsForImage } from "@/modules/player/colors"
import { State, TrackPlayer } from "@/modules/player/utils"

import {
  mapRepeatMode,
  mapTrackPlayerRepeatMode,
  mapTrackPlayerTrackToTrack,
  mapTrackToTrackPlayerInput,
} from "../adapter"
import { areTracksPresentationEqual } from "../session-comparison"
import { setActiveTrack } from "../runtime-state"
import { beginPlayerQueueReplacement, endPlayerQueueReplacement } from "../runtime"
import {
  getCurrentTimeState,
  getCurrentTrackState,
  getImmediateQueueTrackIdsState,
  getIsPlayingState,
  getIsShuffledState,
  getOriginalQueueTrackIdsState,
  getQueueContextState,
  getQueueState,
  getQueueTrackIdsState,
  getRepeatModeState,
  getTracksState,
  setImmediateQueueTrackIdsState,
  setIsPlayingState,
  setQueueState,
  setQueueTrackIdsState,
  usePlayerStore,
} from "../store"

import { applyResolvedPlaybackSession } from "./apply"
import {
  readNativePlaybackSession,
  readNativePlaybackStatus,
  mapNativeQueueToTracks,
} from "./native-reader"
import {
  persistPlaybackCursorSnapshot,
  persistPlaybackQueueSnapshot,
  readStoredPlaybackSession,
} from "./persistence"
export async function persistPlaybackSession(
  options?: PersistPlaybackSessionOptions
): Promise<void> {
  try {
    if (!options?.cursorOnly) {
      await persistPlaybackQueueSnapshot({
        skipQueueSync: options?.skipQueueSync,
      })
    }

    await persistPlaybackCursorSnapshot(options)
  } catch (error) {
    logError("Failed to persist playback session", error, options)
  }
}

export async function restorePlaybackSession(): Promise<void> {
  try {
    const [nativeStatus, storedSession] = await measurePerfTrace(
      "player.restorePlaybackSession.readSnapshots",
      async () => await Promise.all([readNativePlaybackStatus(), readStoredPlaybackSession()])
    )

    if (
      storedSession &&
      (!nativeStatus?.currentTrackId ||
        storedSession.queue.some((track) => track.id === nativeStatus.currentTrackId))
    ) {
      logInfo("Hydrating playback session from saved snapshot", {
        queueLength: storedSession.queue.length,
        currentTrackId: nativeStatus?.currentTrackId ?? storedSession.currentTrackId,
      })
      applyResolvedPlaybackSession({
        ...storedSession,
        currentTrackId: nativeStatus?.currentTrackId ?? storedSession.currentTrackId,
        isPlaying: nativeStatus?.isPlaying ?? storedSession.isPlaying,
        positionSeconds: nativeStatus?.positionSeconds ?? storedSession.positionSeconds,
        repeatMode: nativeStatus?.repeatMode ?? storedSession.repeatMode,
      })
      return
    }

    const nativeSession = await measurePerfTrace(
      "player.restorePlaybackSession.readNativeSession",
      async () => await readNativePlaybackSession()
    )
    if (nativeSession) {
      logInfo("Restoring playback session from native queue", {
        queueLength: nativeSession.queue.length,
      })
      applyResolvedPlaybackSession(nativeSession)
      return
    }

    if (!storedSession) {
      logInfo("No playback session snapshot available to restore")
      return
    }

    logInfo("Hydrating playback session from saved snapshot", {
      queueLength: storedSession.queue.length,
      currentTrackId: storedSession.currentTrackId,
    })
    applyResolvedPlaybackSession(storedSession)
  } catch (error) {
    logError("Failed to restore playback session", error)
  }
}

export async function syncPlaybackSessionFromPlayer() {
  try {
    return await syncPlaybackSessionFromPlayerWithStrategy("full")
  } catch (error) {
    logError("Failed to sync playback session from player", error)
    return false
  }
}

async function syncPlaybackSessionFromPlayerWithStrategy(strategy: "foreground" | "full") {
  if (strategy === "full") {
    const nativeSession = await readNativePlaybackSession()
    if (!nativeSession) {
      return false
    }

    applyResolvedPlaybackSession(nativeSession)
    return true
  }

  const nativeStatus = await readNativePlaybackStatus()
  if (!nativeStatus) {
    return false
  }

  const previousState = usePlayerStore.getState()
  const queue = getQueueState()
  const hasTrackInQueue =
    !nativeStatus.currentTrackId || queue.some((track) => track.id === nativeStatus.currentTrackId)
  const storedSession = await readStoredPlaybackSession()

  if (
    storedSession &&
    (!nativeStatus.currentTrackId ||
      storedSession.queue.some((track) => track.id === nativeStatus.currentTrackId)) &&
    (queue.length === 0 || !hasTrackInQueue)
  ) {
    applyResolvedPlaybackSession({
      ...storedSession,
      currentTrackId: nativeStatus.currentTrackId ?? storedSession.currentTrackId,
      isPlaying: nativeStatus.isPlaying,
      positionSeconds: nativeStatus.positionSeconds,
      repeatMode: nativeStatus.repeatMode,
    })
    return true
  }

  if (queue.length === 0 || !hasTrackInQueue) {
    if (
      storedSession &&
      (!nativeStatus.currentTrackId ||
        storedSession.queue.some((track) => track.id === nativeStatus.currentTrackId))
    ) {
      applyResolvedPlaybackSession({
        ...storedSession,
        currentTrackId: nativeStatus.currentTrackId ?? storedSession.currentTrackId,
        isPlaying: nativeStatus.isPlaying,
        positionSeconds: nativeStatus.positionSeconds,
        repeatMode: nativeStatus.repeatMode,
      })
      return true
    }

    const nativeSession = await readNativePlaybackSession()
    if (!nativeSession) {
      return false
    }

    applyResolvedPlaybackSession(nativeSession)
    return true
  }

  const resolvedCurrentTrack =
    (nativeStatus.currentTrackId
      ? (queue.find((track) => track.id === nativeStatus.currentTrackId) ?? null)
      : previousState.currentTrack) || nativeStatus.currentTrack
  const shouldUpdateCurrentTrack = !areTracksPresentationEqual(
    previousState.currentTrack,
    resolvedCurrentTrack
  )
  const nextDuration = resolvedCurrentTrack?.duration || 0
  const updates: Partial<ReturnType<typeof usePlayerStore.getState>> = {}

  if (shouldUpdateCurrentTrack) {
    updates.currentTrack = resolvedCurrentTrack
  }

  if (previousState.duration !== nextDuration) {
    updates.duration = nextDuration
  }

  if (
    Math.abs(previousState.currentTime - nativeStatus.positionSeconds) >= PLAYBACK_POSITION_EPSILON
  ) {
    updates.currentTime = nativeStatus.positionSeconds
  }

  if (previousState.repeatMode !== nativeStatus.repeatMode) {
    updates.repeatMode = nativeStatus.repeatMode
  }

  if (previousState.isPlaying !== nativeStatus.isPlaying) {
    updates.isPlaying = nativeStatus.isPlaying
  }

  if (Object.keys(updates).length === 0) {
    return true
  }

  usePlayerStore.setState(updates)

  if (shouldUpdateCurrentTrack) {
    void updateColorsForImage(resolvedCurrentTrack?.image)
  }

  return true
}

export async function syncPlaybackStateAfterForeground() {
  try {
    return await syncPlaybackSessionFromPlayerWithStrategy("foreground")
  } catch (error) {
    logError("Failed to sync playback state after foreground", error)
    return false
  }
}

export async function ensureNativePlaybackQueue(options?: { autoPlay?: boolean }) {
  const nativeQueue = await TrackPlayer.getQueue()
  if (nativeQueue.length > 0) {
    return true
  }

  const queue = getQueueState()
  if (queue.length === 0) {
    return false
  }

  const currentTrackId = getCurrentTrackState()?.id ?? queue[0]?.id ?? null
  const targetIndex = currentTrackId ? queue.findIndex((track) => track.id === currentTrackId) : 0
  const positionSeconds = Math.max(0, getCurrentTimeState())

  logInfo("Hydrating native playback queue from player store", {
    queueLength: queue.length,
    currentTrackId,
    autoPlay: options?.autoPlay ?? false,
  })

  beginPlayerQueueReplacement()

  try {
    await TrackPlayer.reset()
    await TrackPlayer.add(queue.map(mapTrackToTrackPlayerInput))
    await TrackPlayer.setRepeatMode(mapRepeatMode(getRepeatModeState()))

    if (targetIndex > 0) {
      await TrackPlayer.skip(targetIndex)
    }

    if (positionSeconds > 0) {
      await TrackPlayer.seekTo(positionSeconds)
    }

    if (options?.autoPlay) {
      await TrackPlayer.play()
      setIsPlayingState(true)
    }

    return true
  } finally {
    endPlayerQueueReplacement()
  }
}

export async function syncCurrentTrackFromPlayer(options?: SyncCurrentTrackOptions): Promise<void> {
  try {
    const shouldRefreshQueue = options?.skipQueueRefresh !== true
    const shouldUseProvidedActiveIndex = options?.activeIndex !== undefined
    const shouldUseProvidedActiveTrack = options?.activeTrack !== undefined
    const [resolvedActiveIndex, resolvedActiveTrack] = await Promise.all([
      shouldUseProvidedActiveIndex
        ? Promise.resolve(options?.activeIndex ?? null)
        : TrackPlayer.getCurrentTrack(),
      shouldUseProvidedActiveTrack
        ? Promise.resolve(options?.activeTrack ?? null)
        : TrackPlayer.getActiveTrack(),
    ])
    const mappedQueue = shouldRefreshQueue
      ? mapNativeQueueToTracks(await TrackPlayer.getQueue())
      : getQueueState()

    if (shouldRefreshQueue && mappedQueue.length > 0) {
      setQueueState(mappedQueue)
      setQueueTrackIdsState(mappedQueue.map((track) => track.id))

      const mappedQueueIdSet = new Set(mappedQueue.map((track) => track.id))
      const currentImmediateIds = getImmediateQueueTrackIdsState()
      const nextImmediateIds = currentImmediateIds.filter((trackId) =>
        mappedQueueIdSet.has(trackId)
      )

      if (nextImmediateIds.length !== currentImmediateIds.length) {
        setImmediateQueueTrackIdsState(nextImmediateIds)
      }
    }

    if (
      resolvedActiveIndex !== null &&
      resolvedActiveIndex >= 0 &&
      resolvedActiveIndex < mappedQueue.length
    ) {
      const consumedTrackIds = new Set(
        mappedQueue.slice(0, resolvedActiveIndex + 1).map((track) => track.id)
      )
      const currentImmediateIds = getImmediateQueueTrackIdsState()
      const nextImmediateIds = currentImmediateIds.filter(
        (trackId) => !consumedTrackIds.has(trackId)
      )

      if (nextImmediateIds.length !== currentImmediateIds.length) {
        setImmediateQueueTrackIdsState(nextImmediateIds)
      }

      setActiveTrack(mappedQueue[resolvedActiveIndex] || null)
      return
    }

    if (!resolvedActiveTrack) {
      setActiveTrack(mappedQueue[0] || null)
      return
    }

    const mappedTrack = mapTrackPlayerTrackToTrack(resolvedActiveTrack, getTracksState())
    setActiveTrack(mappedTrack)
  } catch (error) {
    logError("Failed to sync current track from player", error)
  }
}
