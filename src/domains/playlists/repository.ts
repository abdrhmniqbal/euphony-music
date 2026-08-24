import { and, asc, desc, eq, sql } from "drizzle-orm"

import { db } from "@/core/db"
import { playlists, playlistTracks, tracks } from "@/core/db/schema"
import { logError } from "@/core/log/service"
import { generateId } from "@/lib/id"

function normalizeDescription(description?: string | null): string | null {
  const value = description?.trim()
  if (!value) {
    return null
  }

  return value
}

type PlaylistRowWithTracks = Awaited<ReturnType<typeof findPlaylistRows>>[number]

async function findPlaylistRows() {
  return db.query.playlists.findMany({
    orderBy: [desc(playlists.createdAt)],
    with: {
      tracks: {
        limit: 10,
        orderBy: [asc(playlistTracks.position)],
        with: {
          track: {
            with: {
              album: true,
            },
          },
        },
      },
    },
  })
}

export function collectPlaylistImages(playlist: {
  artwork?: string | null
  tracks: Array<{
    track?: {
      artwork?: string | null
      album?: {
        artwork?: string | null
      } | null
    } | null
  }>
}) {
  const images = new Set<string>()

  if (playlist.artwork) {
    images.add(playlist.artwork)
  }

  for (const playlistTrack of playlist.tracks) {
    const artwork = playlistTrack.track?.artwork || playlistTrack.track?.album?.artwork

    if (!artwork) {
      continue
    }

    images.add(artwork)

    if (images.size >= 4) {
      break
    }
  }

  return Array.from(images)
}

export interface PlaylistSummaryRow {
  id: string
  name: string
  trackCount: number
  image?: string
  images: string[]
}

function toSummary(playlist: PlaylistRowWithTracks): PlaylistSummaryRow {
  return {
    id: playlist.id,
    name: playlist.name,
    trackCount: playlist.trackCount || 0,
    image: playlist.artwork ?? undefined,
    images: collectPlaylistImages(playlist),
  }
}

export async function listPlaylists(): Promise<PlaylistSummaryRow[]> {
  const results = await findPlaylistRows()
  return results.map(toSummary)
}

export async function listPlaylistsForTrack(trackId: string | null) {
  const [results, membershipRows] = await Promise.all([
    listPlaylists(),
    trackId
      ? db
          .select({ playlistId: playlistTracks.playlistId })
          .from(playlistTracks)
          .where(eq(playlistTracks.trackId, trackId))
      : Promise.resolve(new Array<{ playlistId: string }>()),
  ])

  const playlistIdsWithTrack = new Set(membershipRows.map((row) => row.playlistId))

  return results.map((playlist) => ({
    ...playlist,
    hasTrack: playlistIdsWithTrack.has(playlist.id),
  }))
}

export interface PlaylistDetail {
  id: string
  name: string
  description: string | null
  artwork: string | null
  isFavorite: boolean
  trackCount: number
  createdAt: number
  updatedAt: number
  tracks: PlaylistDetailRelation[]
  images: string[]
}

export interface PlaylistDetailRelation {
  id: string
  trackId: string
  position: number
  addedAt: number | null
  track: PlaylistDetailRelationTrack | null
}

interface PlaylistDetailRelationTrack {
  id: string
  title: string
  artwork: string | null
  duration: number
  uri: string
  rawArtist: string | null
  artistName: string | null
  albumTitle: string | null
  albumArtwork: string | null
  year: number | null
  playCount: number | null
  lastPlayedAt: number | null
  dateAdded: number | null
  filename: string | null
  discNumber: number | null
  trackNumber: number | null
  albumId: string | null
}

export async function getPlaylistById(id: string): Promise<PlaylistDetail | null> {
  const result = await db.query.playlists.findFirst({
    where: eq(playlists.id, id),
    with: {
      tracks: {
        orderBy: [asc(playlistTracks.position)],
        with: {
          track: {
            with: {
              album: { with: { artist: true } },
              artist: true,
            },
          },
        },
      },
    },
  })

  if (!result) {
    return null
  }

  const relations: PlaylistDetailRelation[] = result.tracks.map((rel) => ({
    id: rel.id,
    trackId: rel.trackId,
    position: rel.position,
    addedAt: rel.addedAt,
    track: rel.track
      ? {
          id: rel.track.id,
          title: rel.track.title,
          artwork: rel.track.artwork,
          duration: rel.track.duration,
          uri: rel.track.uri,
          rawArtist: rel.track.rawArtist,
          artistName: rel.track.artist?.name ?? null,
          albumTitle: rel.track.album?.title ?? null,
          albumArtwork: rel.track.album?.artwork ?? null,
          year: rel.track.album?.year ?? null,
          playCount: rel.track.playCount,
          lastPlayedAt: rel.track.lastPlayedAt,
          dateAdded: rel.track.dateAdded,
          filename: rel.track.filename,
          discNumber: rel.track.discNumber,
          trackNumber: rel.track.trackNumber,
          albumId: rel.track.albumId,
        }
      : null,
  }))

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    artwork: result.artwork,
    isFavorite: (result.isFavorite ?? 0) === 1,
    trackCount: result.trackCount ?? 0,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    tracks: relations,
    images: collectPlaylistImages(result),
  }
}

type PlaylistWriteDb = Pick<typeof db, "delete" | "insert" | "select" | "update">

function toPlaylistTrackRows(playlistId: string, trackIds: string[], now: number) {
  return trackIds.map((trackId, index) => ({
    id: generateId(),
    playlistId,
    trackId,
    position: index,
    addedAt: now,
  }))
}

async function replacePlaylistTrackMembership(
  database: PlaylistWriteDb,
  playlistId: string,
  trackIds: string[],
  now: number
) {
  await database.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId))

  if (trackIds.length === 0) {
    return
  }

  const rows = toPlaylistTrackRows(playlistId, trackIds, now)
  const chunkSize = 100 // Avoid SQLite variable limits (5 params per row = 500 params)

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    await database.insert(playlistTracks).values(chunk)
  }
}

async function recomputePlaylistStats(database: PlaylistWriteDb, playlistId: string, now: number) {
  const [stats] = await database
    .select({
      trackCount: sql<number>`count(${playlistTracks.id})`,
      duration: sql<number>`coalesce(sum(${tracks.duration}), 0)`,
    })
    .from(playlistTracks)
    .leftJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .where(eq(playlistTracks.playlistId, playlistId))

  await database
    .update(playlists)
    .set({
      trackCount: Number(stats?.trackCount ?? 0),
      duration: Number(stats?.duration ?? 0),
      updatedAt: now,
    })
    .where(eq(playlists.id, playlistId))
}

async function resequencePlaylistTracks(database: PlaylistWriteDb, playlistId: string) {
  const remainingTracks = await database
    .select({ id: playlistTracks.id })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(asc(playlistTracks.position))

  for (let i = 0; i < remainingTracks.length; i++) {
    const playlistTrack = remainingTracks[i]
    if (!playlistTrack) continue

    await database
      .update(playlistTracks)
      .set({ position: i })
      .where(eq(playlistTracks.id, playlistTrack.id))
  }
}

export async function createPlaylist(
  name: string,
  description?: string | null,
  trackIds: string[] = []
): Promise<void> {
  try {
    const id = generateId()
    const now = Date.now()
    const normalizedDescription = normalizeDescription(description)

    await db.transaction(async (tx) => {
      await tx.insert(playlists).values({
        id,
        name,
        description: normalizedDescription,
        trackCount: 0,
        duration: 0,
        createdAt: now,
        updatedAt: now,
      })

      await replacePlaylistTrackMembership(tx, id, trackIds, now)
      await recomputePlaylistStats(tx, id, now)
    })
  } catch (error) {
    logError("Failed to create playlist", error, {
      name,
      trackCount: trackIds.length,
    })
    throw error
  }
}

export async function updatePlaylist(
  id: string,
  name: string,
  description?: string | null,
  trackIds: string[] = []
): Promise<void> {
  try {
    const now = Date.now()
    const normalizedDescription = normalizeDescription(description)

    await db.transaction(async (tx) => {
      await tx
        .update(playlists)
        .set({
          name,
          description: normalizedDescription,
          updatedAt: now,
        })
        .where(eq(playlists.id, id))

      await replacePlaylistTrackMembership(tx, id, trackIds, now)
      await recomputePlaylistStats(tx, id, now)
    })
  } catch (error) {
    logError("Failed to update playlist", error, {
      id,
      name,
      trackCount: trackIds.length,
    })
    throw error
  }
}

export async function deletePlaylist(id: string) {
  await db.delete(playlists).where(eq(playlists.id, id))
}

export async function addTrackToPlaylist({
  playlistId,
  trackId,
}: {
  playlistId: string
  trackId: string
}) {
  const now = Date.now()
  let skipped = false

  await db.transaction(async (tx) => {
    const [existingEntry] = await tx
      .select({ id: playlistTracks.id })
      .from(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
      .limit(1)

    if (existingEntry) {
      skipped = true
      return
    }

    const [lastTrack] = await tx
      .select({ position: playlistTracks.position })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId))
      .orderBy(desc(playlistTracks.position))
      .limit(1)

    await tx.insert(playlistTracks).values({
      id: generateId(),
      playlistId,
      trackId,
      position: lastTrack ? (lastTrack.position || 0) + 1 : 0,
      addedAt: now,
    })

    await recomputePlaylistStats(tx, playlistId, now)
  })

  return { playlistId, trackId, skipped }
}

export async function addTracksToPlaylist({
  playlistId,
  trackIds,
}: {
  playlistId: string
  trackIds: string[]
}) {
  let added = 0
  for (const trackId of trackIds) {
    const result = await addTrackToPlaylist({ playlistId, trackId })
    if (!result.skipped) {
      added += 1
    }
  }

  return { playlistId, added }
}

export async function removeTrackFromPlaylist({
  playlistId,
  trackId,
}: {
  playlistId: string
  trackId: string
}) {
  const now = Date.now()

  await db.transaction(async (tx) => {
    await tx
      .delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))

    await resequencePlaylistTracks(tx, playlistId)
    await recomputePlaylistStats(tx, playlistId, now)
  })

  return { playlistId, trackId }
}

export async function reorderPlaylistTracks({
  playlistId,
  trackIds,
}: {
  playlistId: string
  trackIds: string[]
}) {
  const now = Date.now()

  await db.transaction(async (tx) => {
    for (let i = 0; i < trackIds.length; i++) {
      const trackId = trackIds[i]
      if (!trackId) continue

      await tx
        .update(playlistTracks)
        .set({ position: i })
        .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
    }

    await recomputePlaylistStats(tx, playlistId, now)
  })
}
