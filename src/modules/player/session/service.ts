/**
 * Purpose: Persists, restores, and synchronizes playback queue, cursor, and source context state.
 * Caller: bootstrap runtime, player service, playback controls, and foreground sync handlers.
 * Dependencies: player session repository, TrackPlayer adapter, player store, runtime services, and player colors service.
 * Main Functions: persistPlaybackSession(), restorePlaybackSession(), syncPlaybackSessionFromPlayer(), ensureNativePlaybackQueue()
 * Side Effects: Reads/writes playback snapshot files, syncs native playback queue, and updates player Zustand state.
 */

import type { PlayerQueueContext, RepeatModeType, Track } from "@/modules/player/types"
import type { RepeatMode } from "@/modules/player/utils"
import { logError, logInfo } from "@/modules/logging/service"
import { measurePerfTrace } from "@/modules/logging/perf-trace"
import { updateColorsForImage } from "@/modules/player/colors"
import {
  loadPlaybackCursorSnapshot,
  loadPlaybackQueueSnapshot,
  savePlaybackCursorSnapshot,
  savePlaybackQueueSnapshot,
  type PersistedPlaybackCursorSnapshot,
  type PersistedPlaybackQueueSnapshot,
} from "@/modules/player/session.repository"
import { State, TrackPlayer } from "@/modules/player/utils"

import {
  mapRepeatMode,
  mapTrackPlayerRepeatMode,
  mapTrackPlayerTrackToTrack,
  mapTrackToTrackPlayerInput,
} from "../adapter"
import {
  areStringArraysEqual,
  areTracksPresentationEqual,
  dedupeTrackIds,
} from "../session-comparison"
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

const MIN_SESSION_SAVE_INTERVAL_MS = 2000
const MAX_TRACKMAP_SIZE = 300
const TRACKMAP_ACTIVE_WINDOW = 120
const PLAYBACK_POSITION_EPSILON = 0.01

type NativeQueue = Awaited<ReturnType<typeof TrackPlayer.getQueue>>
type NativeTrack = Awaited<ReturnType<typeof TrackPlayer.getActiveTrack>>

interface ResolvedPlaybackSession {
  currentTrackId: string | null
  immediateQueueTrackIds: string[]
  isPlaying: boolean
  isShuffled: boolean
  originalQueue: Track[]
  positionSeconds: number
  queue: Track[]
  queueContext: PlayerQueueContext | null
  repeatMode: RepeatModeType
}

interface NativePlaybackStatusSnapshot {
  currentTrack: Track | null
  currentTrackId: string | null
  isPlaying: boolean
  positionSeconds: number
  repeatMode: RepeatModeType
}

interface SyncCurrentTrackOptions {
  activeIndex?: number | null
  activeTrack?: NativeTrack | null
  skipQueueRefresh?: boolean
}

interface PersistPlaybackSessionOptions {
  consumeImmediateQueue?: boolean
  cursor?: Partial<PersistedPlaybackCursorSnapshot> & {
    currentTrack?: Track | null
  }
  cursorOnly?: boolean
  force?: boolean
  skipQueueSync?: boolean
}

let lastPlaybackCursorSavedAt = 0

function mapNativeQueueToTracks(nativeQueue: NativeQueue) {
  return nativeQueue
    .map((track) => mapTrackPlayerTrackToTrack(track, getTracksState()))
    .filter((track) => track.id && track.uri)
}

function createPersistedTrackMap(queueTracks: ReturnType<typeof getQueueState>) {
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

function applyResolvedPlaybackSession(session: ResolvedPlaybackSession) {
  const queueTrackIds = session.queue.map((track) => track.id)
  const originalQueueTrackIds = session.originalQueue.map((track) => track.id)
  const currentTrack =
    (session.currentTrackId
      ? session.queue.find((track) => track.id === session.currentTrackId)
      : null) ||
    session.queue[0] ||
    null
  const nextOriginalQueueTrackIds =
    originalQueueTrackIds.length > 0 ? originalQueueTrackIds : queueTrackIds
  const nextDuration = currentTrack?.duration || 0
  const previousState = usePlayerStore.getState()
  const updates: Partial<ReturnType<typeof usePlayerStore.getState>> = {}
  const shouldUpdateCurrentTrack = !areTracksPresentationEqual(
    previousState.currentTrack,
    currentTrack
  )

  if (!areStringArraysEqual(previousState.queueTrackIds, queueTrackIds)) {
    updates.queue = session.queue
    updates.queueTrackIds = queueTrackIds
  }

  if (!areStringArraysEqual(previousState.originalQueueTrackIds, nextOriginalQueueTrackIds)) {
    updates.originalQueue = session.originalQueue
    updates.originalQueueTrackIds = nextOriginalQueueTrackIds
  }

  if (!areStringArraysEqual(previousState.immediateQueueTrackIds, session.immediateQueueTrackIds)) {
    updates.immediateQueueTrackIds = session.immediateQueueTrackIds
  }

  if (previousState.isShuffled !== session.isShuffled) {
    updates.isShuffled = session.isShuffled
  }

  if (previousState.repeatMode !== session.repeatMode) {
    updates.repeatMode = session.repeatMode
  }

  if (previousState.isPlaying !== session.isPlaying) {
    updates.isPlaying = session.isPlaying
  }

  if (
    previousState.queueContext?.type !== session.queueContext?.type ||
    previousState.queueContext?.title !== session.queueContext?.title
  ) {
    updates.queueContext = session.queueContext
  }

  if (Math.abs(previousState.currentTime - session.positionSeconds) >= PLAYBACK_POSITION_EPSILON) {
    updates.currentTime = session.positionSeconds
  }

  if (previousState.duration !== nextDuration) {
    updates.duration = nextDuration
  }

  if (shouldUpdateCurrentTrack) {
    updates.currentTrack = currentTrack
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  usePlayerStore.setState(updates)

  if (shouldUpdateCurrentTrack) {
    void updateColorsForImage(currentTrack?.image)
  }
}

function resolveTracksFromIds(
  trackIds: string[],
  resolveTrack: (trackId: string) => Track | undefined
) {
  return dedupeTrackIds(trackIds)
    .map((trackId) => resolveTrack(trackId))
    .filter((track): track is Track => Boolean(track))
}

function getActiveIndexForTrackId(trackIds: string[], currentTrackId: string | null) {
  if (!currentTrackId) {
    return null
  }

  const index = trackIds.indexOf(currentTrackId)
  return index >= 0 ? index : null
}

function consumeImmediateQueueIds(
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

async function readStoredPlaybackQueueSnapshot() {
  return await loadPlaybackQueueSnapshot()
}

async function readStoredPlaybackCursorSnapshot() {
  return await loadPlaybackCursorSnapshot()
}

async function readNativePlaybackSession(): Promise<ResolvedPlaybackSession | null> {
  const [nativeQueue, activeIndex, positionSeconds, playbackState, repeatMode] = await Promise.all([
    TrackPlayer.getQueue(),
    TrackPlayer.getCurrentTrack(),
    TrackPlayer.getPosition(),
    TrackPlayer.getState(),
    TrackPlayer.getRepeatMode(),
  ])

  const mappedQueue = mapNativeQueueToTracks(nativeQueue)
  if (mappedQueue.length === 0) {
    return null
  }

  const currentTrackId =
    activeIndex !== null && activeIndex >= 0 && activeIndex < mappedQueue.length
      ? (mappedQueue[activeIndex]?.id ?? null)
      : (mappedQueue[0]?.id ?? null)

  return {
    queue: mappedQueue,
    originalQueue: mappedQueue,
    immediateQueueTrackIds: [],
    currentTrackId,
    positionSeconds: Math.max(0, positionSeconds),
    repeatMode: mapTrackPlayerRepeatMode(repeatMode as RepeatMode),
    isPlaying: playbackState === State.Playing,
    isShuffled: false,
    queueContext: null,
  }
}

async function readNativePlaybackStatus(): Promise<NativePlaybackStatusSnapshot | null> {
  const [activeTrack, positionSeconds, playbackState, repeatMode] = await Promise.all([
    TrackPlayer.getActiveTrack(),
    TrackPlayer.getPosition(),
    TrackPlayer.getState(),
    TrackPlayer.getRepeatMode(),
  ])

  return {
    currentTrack: activeTrack ? mapTrackPlayerTrackToTrack(activeTrack, getTracksState()) : null,
    currentTrackId: activeTrack?.id !== undefined ? String(activeTrack.id) : null,
    positionSeconds: Math.max(0, positionSeconds),
    repeatMode: mapTrackPlayerRepeatMode(repeatMode as RepeatMode),
    isPlaying: playbackState === State.Playing,
  }
}

async function readStoredPlaybackSession(): Promise<ResolvedPlaybackSession | null> {
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

async function persistPlaybackQueueSnapshot(options?: {
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

async function persistPlaybackCursorSnapshot(options?: PersistPlaybackSessionOptions) {
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
