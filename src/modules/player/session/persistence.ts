import { TrackPlayer } from "@/modules/player/utils"
import {
  loadPlaybackCursorSnapshot,
  loadPlaybackQueueSnapshot,
  savePlaybackCursorSnapshot,
  savePlaybackQueueSnapshot,
  type PersistedPlaybackQueueSnapshot,
} from "@/modules/player/session-repository"
import type { Track } from "@/modules/player/types"
import {
  areStringArraysEqual,
  dedupeTrackIds,
} from "../session-comparison"
import {
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
} from "../store"
import { mapNativeQueueToTracks } from "./native-reader"
import type { PersistPlaybackSessionOptions, ResolvedPlaybackSession } from "./types"
import {
  MAX_TRACKMAP_SIZE,
  MIN_SESSION_SAVE_INTERVAL_MS,
  TRACKMAP_ACTIVE_WINDOW,
} from "./types"

let lastPlaybackCursorSavedAt = 0

export function createPersistedTrackMap(queueTracks: ReturnType<typeof getQueueState>) {
  if (queueTracks.length === 0) {
    return {}
  }

  const currentTrackId = getCurrentTrackState()?.id ?? null
  const currentIndex = currentTrackId
    ? queueTracks.findIndex((track) => track.id === currentTrackId)
    : 0
  const startIndex = currentIndex >= 0 ? Math.max(0, currentIndex - TRACKMAP_ACTIVE_WINDOW) : 0
  const endIndex =
    currentIndex >= 0
      ? Math.min(queueTracks.length, currentIndex + TRACKMAP_ACTIVE_WINDOW + 1)
      : Math.min(queueTracks.length, MAX_TRACKMAP_SIZE)
  const selectedIds = new Set(queueTracks.slice(startIndex, endIndex).map((track) => track.id))

  if (currentTrackId) {
    selectedIds.add(currentTrackId)
  }

  if (selectedIds.size < MAX_TRACKMAP_SIZE) {
    for (const trackId of getImmediateQueueTrackIdsState()) {
      selectedIds.add(trackId)
      if (selectedIds.size >= MAX_TRACKMAP_SIZE) {
        break
      }
    }
  }

  if (selectedIds.size < MAX_TRACKMAP_SIZE) {
    for (const track of queueTracks) {
      if (selectedIds.size >= MAX_TRACKMAP_SIZE) {
        break
      }
      selectedIds.add(track.id)
    }
  }

  return Object.fromEntries(
    queueTracks.filter((track) => selectedIds.has(track.id)).map((track) => [track.id, track])
  )
}

export function resolveTracksFromIds(
  trackIds: string[],
  resolveTrack: (trackId: string) => Track | undefined
) {
  return dedupeTrackIds(trackIds)
    .map((trackId) => resolveTrack(trackId))
    .filter((track): track is Track => Boolean(track))
}

export function getActiveIndexForTrackId(trackIds: string[], currentTrackId: string | null) {
  if (!currentTrackId) {
    return null
  }

  const index = trackIds.indexOf(currentTrackId)
  return index >= 0 ? index : null
}

export function consumeImmediateQueueIds(
  queueTrackIds: string[],
  immediateQueueTrackIds: string[],
  options: {
    activeIndex?: number | null
    currentTrackId?: string | null
  }
) {
  if (queueTrackIds.length === 0 || immediateQueueTrackIds.length === 0) {
    return immediateQueueTrackIds
  }

  const resolvedActiveIndex =
    options.activeIndex !== undefined && options.activeIndex !== null
      ? options.activeIndex
      : getActiveIndexForTrackId(queueTrackIds, options.currentTrackId ?? null)

  if (
    resolvedActiveIndex === null ||
    resolvedActiveIndex < 0 ||
    resolvedActiveIndex >= queueTrackIds.length
  ) {
    return immediateQueueTrackIds
  }

  const consumedTrackIds = new Set(queueTrackIds.slice(0, resolvedActiveIndex + 1))
  return immediateQueueTrackIds.filter((trackId) => !consumedTrackIds.has(trackId))
}

export async function readStoredPlaybackQueueSnapshot() {
  return await loadPlaybackQueueSnapshot()
}

export async function readStoredPlaybackCursorSnapshot() {
  return await loadPlaybackCursorSnapshot()
}

export async function readStoredPlaybackSession(): Promise<ResolvedPlaybackSession | null> {
  const [queueSnapshot, cursorSnapshot] = await Promise.all([
    readStoredPlaybackQueueSnapshot(),
    readStoredPlaybackCursorSnapshot(),
  ])
  if (!queueSnapshot || queueSnapshot.queueTrackIds.length === 0) {
    return null
  }

  const libraryTrackMap = new Map(getTracksState().map((track) => [track.id, track]))
  const resolveTrack = (trackId: string) =>
    libraryTrackMap.get(trackId) || queueSnapshot.trackMap[trackId]

  const resolvedQueue = resolveTracksFromIds(queueSnapshot.queueTrackIds, resolveTrack)
  if (resolvedQueue.length === 0) {
    return null
  }

  const resolvedOriginalQueue = resolveTracksFromIds(
    queueSnapshot.originalQueueTrackIds,
    resolveTrack
  )
  const resolvedQueueIdSet = new Set(resolvedQueue.map((track) => track.id))
  const currentTrackId =
    cursorSnapshot?.currentTrackId && resolvedQueueIdSet.has(cursorSnapshot.currentTrackId)
      ? cursorSnapshot.currentTrackId
      : (resolvedQueue[0]?.id ?? null)
  const activeIndex =
    cursorSnapshot?.activeIndex !== null && cursorSnapshot?.activeIndex !== undefined
      ? cursorSnapshot.activeIndex
      : getActiveIndexForTrackId(
          resolvedQueue.map((track) => track.id),
          currentTrackId
        )
  const immediateQueueTrackIds = consumeImmediateQueueIds(
    resolvedQueue.map((track) => track.id),
    dedupeTrackIds(queueSnapshot.immediateQueueTrackIds).filter((trackId) =>
      resolvedQueueIdSet.has(trackId)
    ),
    {
      activeIndex,
      currentTrackId,
    }
  )

  return {
    queue: resolvedQueue,
    originalQueue: resolvedOriginalQueue.length > 0 ? resolvedOriginalQueue : resolvedQueue,
    immediateQueueTrackIds,
    currentTrackId,
    positionSeconds: Math.max(0, cursorSnapshot?.positionSeconds || 0),
    repeatMode: cursorSnapshot?.repeatMode ?? getRepeatModeState(),
    isPlaying: cursorSnapshot?.isPlaying ?? false,
    isShuffled: queueSnapshot.isShuffled,
    queueContext: queueSnapshot.queueContext,
  }
}

export async function persistPlaybackQueueSnapshot(options?: {
  skipQueueSync?: boolean
}): Promise<PersistedPlaybackQueueSnapshot | null> {
  const storeQueueTracks = getQueueState()
  const shouldSyncQueueWithNativePlayer =
    options?.skipQueueSync !== true &&
    (getQueueTrackIdsState().length === 0 || storeQueueTracks.length === 0)
  const queueTracks = shouldSyncQueueWithNativePlayer
    ? mapNativeQueueToTracks(await TrackPlayer.getQueue())
    : storeQueueTracks
  const queueTrackIds = queueTracks.map((track) => track.id)
  const nextSnapshot: PersistedPlaybackQueueSnapshot = {
    queueTrackIds,
    originalQueueTrackIds:
      getOriginalQueueTrackIdsState().length > 0 ? getOriginalQueueTrackIdsState() : queueTrackIds,
    immediateQueueTrackIds: getImmediateQueueTrackIdsState(),
    trackMap: createPersistedTrackMap(queueTracks),
    isShuffled: getIsShuffledState(),
    queueContext: getQueueContextState(),
    savedAt: Date.now(),
  }
  const previousSnapshot = await readStoredPlaybackQueueSnapshot()

  if (
    previousSnapshot &&
    areStringArraysEqual(previousSnapshot.queueTrackIds, nextSnapshot.queueTrackIds) &&
    areStringArraysEqual(
      previousSnapshot.originalQueueTrackIds,
      nextSnapshot.originalQueueTrackIds
    ) &&
    areStringArraysEqual(
      previousSnapshot.immediateQueueTrackIds,
      nextSnapshot.immediateQueueTrackIds
    ) &&
    previousSnapshot.isShuffled === nextSnapshot.isShuffled &&
    previousSnapshot.queueContext?.type === nextSnapshot.queueContext?.type &&
    previousSnapshot.queueContext?.title === nextSnapshot.queueContext?.title
  ) {
    return previousSnapshot
  }

  await savePlaybackQueueSnapshot(nextSnapshot)
  return nextSnapshot
}

export async function persistPlaybackCursorSnapshot(options?: PersistPlaybackSessionOptions) {
  const now = Date.now()
  if (!options?.force && now - lastPlaybackCursorSavedAt < MIN_SESSION_SAVE_INTERVAL_MS) {
    return false
  }

  const previousCursorSnapshot = await readStoredPlaybackCursorSnapshot()
  const providedCurrentTrack = options?.cursor?.currentTrack
  const persistedQueueSnapshot = await readStoredPlaybackQueueSnapshot()
  const currentTrackId =
    options?.cursor?.currentTrackId ??
    providedCurrentTrack?.id ??
    getCurrentTrackState()?.id ??
    previousCursorSnapshot?.currentTrackId ??
    null
  const derivedActiveIndex = getActiveIndexForTrackId(
    persistedQueueSnapshot?.queueTrackIds ?? getQueueTrackIdsState(),
    currentTrackId
  )
  const activeIndex =
    options?.cursor?.activeIndex ??
    (currentTrackId && previousCursorSnapshot?.currentTrackId === currentTrackId
      ? previousCursorSnapshot.activeIndex
      : null) ??
    derivedActiveIndex
  const repeatMode = options?.cursor?.repeatMode ?? getRepeatModeState()
  const isPlaying = options?.cursor?.isPlaying ?? getIsPlayingState()
  const shouldReadNativePosition =
    options?.force === true ||
    options?.consumeImmediateQueue === true ||
    options?.cursor?.currentTrackId !== undefined ||
    options?.cursor?.activeIndex !== undefined ||
    options?.cursor?.currentTrack !== undefined
  const positionSeconds =
    options?.cursor?.positionSeconds ??
    (shouldReadNativePosition
      ? await TrackPlayer.getPosition()
      : (previousCursorSnapshot?.positionSeconds ?? (await TrackPlayer.getPosition())))

  if (options?.consumeImmediateQueue && persistedQueueSnapshot) {
    const nextImmediateQueueTrackIds = consumeImmediateQueueIds(
      persistedQueueSnapshot.queueTrackIds,
      persistedQueueSnapshot.immediateQueueTrackIds,
      {
        activeIndex,
        currentTrackId,
      }
    )

    if (
      !areStringArraysEqual(
        persistedQueueSnapshot.immediateQueueTrackIds,
        nextImmediateQueueTrackIds
      )
    ) {
      await savePlaybackQueueSnapshot({
        ...persistedQueueSnapshot,
        immediateQueueTrackIds: nextImmediateQueueTrackIds,
        savedAt: now,
      })
    }
  }

  await savePlaybackCursorSnapshot({
    currentTrackId,
    activeIndex,
    positionSeconds,
    isPlaying,
    repeatMode,
    savedAt: now,
  })
  lastPlaybackCursorSavedAt = now
  return true
}
