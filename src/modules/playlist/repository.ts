/**
 * Purpose: Provides playlist persistence, membership queries, ordering, playlist track ids, and playlist track hydration.
 * Caller: Playlist queries, mutations, picker sheets, and playlist detail screens.
 * Dependencies: Drizzle database client, playlist tables, track relations, and logging service.
 * Main Functions: listPlaylists(), getPlaylistById(), getPlaylistTrackIdsByPlaylistIds(), createPlaylist(), addTrackToPlaylist(), removeTrackFromPlaylist(), reorderPlaylistTracks().
 * Side Effects: Reads and writes playlist rows and playlist track membership rows.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { playlists, playlistTracks, tracks } from "@/db/schema"
import { logError } from "@/modules/logging/service"
import { generateId } from "@/utils/common"
import { trackHydrationRelations } from "@/db/track-relations"

function normalizeDescription(description?: string | null): string | null {
  const value = description?.trim()
  if (!value) {
    return null
  }

  return value
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

export async function listPlaylists() {
  const results = await db.query.playlists.findMany({
    orderBy: [desc(playlists.createdAt)],
    with: {
      tracks: {
        limit: 10,
        orderBy: [asc(playlistTracks.position)],
        with: {
          track: {
            with: trackHydrationRelations,
          },
        },
      },
    },
  })

  return results.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    title: playlist.name,
    dateAdded: playlist.createdAt,
    trackCount: playlist.trackCount || 0,
    image: playlist.artwork || undefined,
    images: collectPlaylistImages(playlist),
  }))
}

export async function listPlaylistsForTrack(trackId: string | null) {
  const [results, membershipRows] = await Promise.all([
    listPlaylists(),
    trackId
      ? db
          .select({ playlistId: playlistTracks.playlistId })
          .from(playlistTracks)
          .where(eq(playlistTracks.trackId, trackId))
      : Promise.resolve([]),
  ])

  const playlistIdsWithTrack = new Set(membershipRows.map((row) => row.playlistId))

  return results.map((playlist) => ({
    ...playlist,
    hasTrack: playlistIdsWithTrack.has(playlist.id),
  }))
}

export async function getPlaylistById(id: string) {
  const result = await db.query.playlists.findFirst({
    where: eq(playlists.id, id),
    with: {
      tracks: {
        orderBy: [asc(playlistTracks.position)],
        with: {
          track: {
            with: trackHydrationRelations,
          },
        },
      },
    },
  })

  return result ?? null
}

export async function getPlaylistTrackIdsByPlaylistIds(playlistIds: string[]) {
  if (playlistIds.length === 0) {
    return []
  }

  return await db
    .select({
      playlistId: playlistTracks.playlistId,
      trackId: playlistTracks.trackId,
      position: playlistTracks.position,
    })
    .from(playlistTracks)
    .where(inArray(playlistTracks.playlistId, playlistIds))
    .orderBy(asc(playlistTracks.playlistId), asc(playlistTracks.position))
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

export async function updatePlaylistMetadata({
  id,
  name,
  description,
}: {
  id: string
  name?: string
  description?: string
}) {
  await db
    .update(playlists)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: normalizeDescription(description) } : {}),
      updatedAt: Date.now(),
    })
    .where(eq(playlists.id, id))
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

export type Playlist = {
  id: string
  name: string
  artwork: string | null
  isFavorite: boolean
  trackCount: number
}

function toPlaylist(row: typeof playlists.$inferSelect): Playlist {
  return {
    id: row.id,
    name: row.name,
    artwork: row.artwork ?? null,
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
  }
}

export async function getPlaylist(id: string) {
  const row = await db.query.playlists.findFirst({ where: eq(playlists.id, id) })
  if (!row) throw new Error("err.msg.noPlaylists")
  return toPlaylist(row)
}

export async function getPlaylistsSummary() {
  const rows = await db.query.playlists.findMany({
    orderBy: asc(sql`lower(coalesce(${playlists.name}, ''))`),
  })
  return rows.map(toPlaylist)
}

export async function getPlaylistTracks<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds
) {
  const rels = await db
    .select({ trackId: playlistTracks.trackId })
    .from(playlistTracks)
    .innerJoin(playlists, eq(playlistTracks.playlistId, playlists.id))
    .where(eq(playlists.name, id))
    .orderBy(asc(playlistTracks.position))

  const trackIds = rels.map((r) => r.trackId)
  if (trackIds.length === 0) return [] as TOnlyIds extends true ? Array<{ id: string }> : never[]

  if (onlyIds) {
    return trackIds.map((tid) => ({ id: tid })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : never[]
  }

  const rows = await db.query.tracks.findMany({
    where: inArray(tracks.id, trackIds),
    with: { artist: true, album: { with: { artist: true } } },
  })
  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}
