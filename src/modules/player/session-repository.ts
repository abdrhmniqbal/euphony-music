/**
 * Purpose: Persists and sanitizes playback queue and cursor snapshots for session restore.
 * Caller: player-session service.
 * Dependencies: Expo FileSystem document storage and player domain types.
 * Main Functions: savePlaybackQueueSnapshot(), loadPlaybackQueueSnapshot(), savePlaybackCursorSnapshot(), loadPlaybackCursorSnapshot()
 * Side Effects: Reads and writes playback snapshot JSON files in app document storage.
 */

import type { PlayerQueueContext, PlayerQueueContextType, RepeatModeType, Track } from "./types"
import { File, Paths } from "expo-file-system"

export interface PersistedPlaybackQueueSnapshot {
  immediateQueueTrackIds: string[]
  isShuffled: boolean
  originalQueueTrackIds: string[]
  queueContext: PlayerQueueContext | null
  queueTrackIds: string[]
  savedAt: number
  trackMap: Record<string, Track>
}

export interface PersistedPlaybackCursorSnapshot {
  activeIndex: number | null
  currentTrackId: string | null
  isPlaying: boolean
  positionSeconds: number
  repeatMode: RepeatModeType
  savedAt: number
}

interface LegacyPersistedPlaybackSession
  extends PersistedPlaybackQueueSnapshot, PersistedPlaybackCursorSnapshot {}

const PLAYBACK_QUEUE_FILE = new File(Paths.document, "playback-queue.json")
const PLAYBACK_CURSOR_FILE = new File(Paths.document, "playback-cursor.json")
const LEGACY_PLAYBACK_SESSION_FILE = new File(Paths.document, "playback-session.json")
const PLAYER_QUEUE_CONTEXT_TYPES = new Set<PlayerQueueContextType>([
  "album",
  "artist",
  "playlist",
  "genre",
  "search",
  "favorites",
  "folder",
  "trackList",
  "external",
])

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null
  }

  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function sanitizeQueueContext(value: unknown): PlayerQueueContext | null {
  const source = asObject(value)
  if (!source) {
    return null
  }

  const type = asString(source.type)
  const title = asString(source.title)?.trim()

  if (!type || !PLAYER_QUEUE_CONTEXT_TYPES.has(type as PlayerQueueContextType) || !title) {
    return null
  }

  return {
    type: type as PlayerQueueContextType,
    title,
  }
}

function sanitizeTrack(track: unknown): Track | null {
  const source = asObject(track)
  if (!source) {
    return null
  }

  const id = asString(source.id) || ""
  const title = asString(source.title) || ""
  const uri = asString(source.uri) || ""

  if (!id || !title || !uri) {
    return null
  }

  return {
    id,
    title,
    artist: asString(source.artist),
    artistId: asString(source.artistId),
    albumArtist: asString(source.albumArtist),
    album: asString(source.album),
    albumId: asString(source.albumId),
    duration: asNumber(source.duration) ?? 0,
    uri,
    image: asString(source.image),
    lyrics: asString(source.lyrics),
    fileHash: asString(source.fileHash),
    scanTime: asNumber(source.scanTime),
    isDeleted: asBoolean(source.isDeleted),
    playCount: asNumber(source.playCount),
    lastPlayedAt: asNumber(source.lastPlayedAt),
    year: asNumber(source.year),
    filename: asString(source.filename),
    dateAdded: asNumber(source.dateAdded),
    isFavorite: asBoolean(source.isFavorite),
    discNumber: asNumber(source.discNumber),
    trackNumber: asNumber(source.trackNumber),
    genre: asString(source.genre),
  }
}

function sanitizeLegacySession(payload: unknown): LegacyPersistedPlaybackSession | null {
  const source = asObject(payload)
  if (!source) {
    return null
  }

  const hasIdQueue = Array.isArray(source.queueTrackIds)
  const hasLegacyQueue = Array.isArray(source.queue)

  if (!hasIdQueue && !hasLegacyQueue) {
    return null
  }

  const trackMap: Record<string, Track> = {}
  let queueTrackIds: string[] = []

  if (hasIdQueue) {
    const payloadTrackMap = asObject(source.trackMap) || {}

    for (const [trackId, value] of Object.entries(payloadTrackMap)) {
      const sanitized = sanitizeTrack(value)
      if (!sanitized) {
        continue
      }

      trackMap[sanitized.id] = sanitized
      if (sanitized.id !== trackId) {
        trackMap[trackId] = sanitized
      }
    }

    queueTrackIds =
      (source.queueTrackIds as unknown[])
        ?.filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index) || []
  } else {
    const legacyQueue = (source.queue as unknown[])
      .map((item) => sanitizeTrack(item))
      .filter((item): item is Track => Boolean(item))

    for (const item of legacyQueue) {
      trackMap[item.id] = item
    }

    queueTrackIds = legacyQueue.map((item) => item.id)
  }

  const originalQueueTrackIds = Array.isArray(source.originalQueueTrackIds)
    ? (source.originalQueueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : [...queueTrackIds]

  const immediateQueueTrackIds = Array.isArray(source.immediateQueueTrackIds)
    ? (source.immediateQueueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : []

  const repeatMode: RepeatModeType =
    source.repeatMode === "track" || source.repeatMode === "queue" || source.repeatMode === "off"
      ? (source.repeatMode as RepeatModeType)
      : "off"
  const currentTrackIdValue = asString(source.currentTrackId)
  const currentTrackId =
    currentTrackIdValue && trackMap[currentTrackIdValue] ? currentTrackIdValue : null
  const activeIndexValue = asNumber(source.activeIndex)
  const fallbackActiveIndex = currentTrackId !== null ? queueTrackIds.indexOf(currentTrackId) : -1

  return {
    queueTrackIds,
    originalQueueTrackIds,
    immediateQueueTrackIds,
    trackMap,
    queueContext: sanitizeQueueContext(source.queueContext),
    currentTrackId,
    activeIndex:
      activeIndexValue !== undefined
        ? Math.max(0, Math.trunc(activeIndexValue))
        : fallbackActiveIndex >= 0
          ? fallbackActiveIndex
          : null,
    positionSeconds: Math.max(0, asNumber(source.positionSeconds) ?? 0),
    repeatMode,
    isPlaying: Boolean(source.wasPlaying),
    isShuffled: Boolean(source.isShuffled),
    savedAt: asNumber(source.savedAt) ?? Date.now(),
  }
}

function sanitizeQueueSnapshot(payload: unknown): PersistedPlaybackQueueSnapshot | null {
  const source = asObject(payload)
  if (!source) {
    return null
  }

  const payloadTrackMap = asObject(source.trackMap) || {}
  const trackMap: Record<string, Track> = {}

  for (const [trackId, value] of Object.entries(payloadTrackMap)) {
    const sanitized = sanitizeTrack(value)
    if (!sanitized) {
      continue
    }

    trackMap[sanitized.id] = sanitized
    if (sanitized.id !== trackId) {
      trackMap[trackId] = sanitized
    }
  }

  const queueTrackIds = Array.isArray(source.queueTrackIds)
    ? (source.queueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : []

  const originalQueueTrackIds = Array.isArray(source.originalQueueTrackIds)
    ? (source.originalQueueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : [...queueTrackIds]

  const immediateQueueTrackIds = Array.isArray(source.immediateQueueTrackIds)
    ? (source.immediateQueueTrackIds as unknown[])
        .filter((trackId): trackId is string => typeof trackId === "string")
        .filter((trackId) => Boolean(trackMap[trackId]))
        .filter((trackId, index, array) => array.indexOf(trackId) === index)
    : []

  return {
    queueTrackIds,
    originalQueueTrackIds,
    immediateQueueTrackIds,
    trackMap,
    queueContext: sanitizeQueueContext(source.queueContext),
    isShuffled: Boolean(source.isShuffled),
    savedAt: asNumber(source.savedAt) ?? Date.now(),
  }
}

function sanitizeCursorSnapshot(payload: unknown): PersistedPlaybackCursorSnapshot | null {
  const source = asObject(payload)
  if (!source) {
    return null
  }

  const repeatMode: RepeatModeType =
    source.repeatMode === "track" || source.repeatMode === "queue" || source.repeatMode === "off"
      ? (source.repeatMode as RepeatModeType)
      : "off"
  const currentTrackIdValue = asString(source.currentTrackId)
  const activeIndexValue = asNumber(source.activeIndex)

  return {
    currentTrackId:
      currentTrackIdValue && currentTrackIdValue.length > 0 ? currentTrackIdValue : null,
    activeIndex:
      activeIndexValue !== undefined && Math.trunc(activeIndexValue) >= 0
        ? Math.trunc(activeIndexValue)
        : null,
    positionSeconds: Math.max(0, asNumber(source.positionSeconds) ?? 0),
    isPlaying: Boolean(source.isPlaying),
    repeatMode,
    savedAt: asNumber(source.savedAt) ?? Date.now(),
  }
}

function ensureFile(file: File) {
  if (!file.exists) {
    file.create({
      intermediates: true,
      overwrite: true,
    })
  }
}

function readJsonFile(file: File): unknown | null {
  if (!file.exists) {
    return null
  }

  return JSON.parse(file.textSync()) as unknown
}

export async function savePlaybackQueueSnapshot(
  snapshot: PersistedPlaybackQueueSnapshot
): Promise<void> {
  const sanitized = sanitizeQueueSnapshot(snapshot)
  if (!sanitized) {
    return
  }

  ensureFile(PLAYBACK_QUEUE_FILE)
  PLAYBACK_QUEUE_FILE.write(JSON.stringify(sanitized), {
    encoding: "utf8",
  })
}

export async function loadPlaybackQueueSnapshot(): Promise<PersistedPlaybackQueueSnapshot | null> {
  try {
    const queueSnapshot = sanitizeQueueSnapshot(readJsonFile(PLAYBACK_QUEUE_FILE))
    if (queueSnapshot) {
      return queueSnapshot
    }

    const legacy = sanitizeLegacySession(readJsonFile(LEGACY_PLAYBACK_SESSION_FILE))
    if (!legacy) {
      return null
    }

    return {
      queueTrackIds: legacy.queueTrackIds,
      originalQueueTrackIds: legacy.originalQueueTrackIds,
      immediateQueueTrackIds: legacy.immediateQueueTrackIds,
      trackMap: legacy.trackMap,
      queueContext: legacy.queueContext,
      isShuffled: legacy.isShuffled,
      savedAt: legacy.savedAt,
    }
  } catch {
    return null
  }
}

export async function savePlaybackCursorSnapshot(
  snapshot: PersistedPlaybackCursorSnapshot
): Promise<void> {
  const sanitized = sanitizeCursorSnapshot(snapshot)
  if (!sanitized) {
    return
  }

  ensureFile(PLAYBACK_CURSOR_FILE)
  PLAYBACK_CURSOR_FILE.write(JSON.stringify(sanitized), {
    encoding: "utf8",
  })
}

export async function loadPlaybackCursorSnapshot(): Promise<PersistedPlaybackCursorSnapshot | null> {
  try {
    const cursorSnapshot = sanitizeCursorSnapshot(readJsonFile(PLAYBACK_CURSOR_FILE))
    if (cursorSnapshot) {
      return cursorSnapshot
    }

    const legacy = sanitizeLegacySession(readJsonFile(LEGACY_PLAYBACK_SESSION_FILE))
    if (!legacy) {
      return null
    }

    return {
      currentTrackId: legacy.currentTrackId,
      activeIndex: legacy.activeIndex,
      positionSeconds: legacy.positionSeconds,
      isPlaying: legacy.isPlaying,
      repeatMode: legacy.repeatMode,
      savedAt: legacy.savedAt,
    }
  } catch {
    return null
  }
}
