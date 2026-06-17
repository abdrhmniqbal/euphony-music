import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { playHistory, playlistTracks, tracks } from "@/db/schema"
import { trackRelationTables } from "./constants"
import type { BulkQueriedTrack, SortedTrack, Track } from "./types"
import type { DrizzleFilter, TracksSortOptions } from "../types"

type TrackRow = typeof tracks.$inferSelect & {
  artist?: { name: string } | null
  album?: { title: string; artist?: { name: string } | null } | null
}

function toDataTrack(row: TrackRow): Track {
  return {
    id: row.id,
    name: row.title,
    artwork: row.artwork ?? null,
    artists: row.artist?.name ? [row.artist.name] : null,
    artistName: row.artist?.name ?? null,
    albumName: row.album?.title ?? null,
    albumId: row.albumId ?? null,
    uri: row.uri,
    duration: row.duration,
    discoverTime: row.dateAdded ?? null,
    modificationTime: row.scanTime ?? null,
    rawArtistName: row.rawArtist ?? null,
    parentFolder: row.uri.split("/").slice(0, -1).join("/") || null,
  }
}

export async function getTrack(id: string): Promise<Track> {
  const row = await db.query.tracks.findFirst({
    where: and(eq(tracks.id, id), eq(tracks.isDeleted, 0)),
    with: {
      artist: true,
      album: { with: { artist: true } },
      featuredArtists: { with: { artist: true } },
      genres: { with: { genre: true } },
    },
  })

  if (!row) {
    throw new Error("err.msg.noTracks")
  }

  return toDataTrack(row)
}

export async function getSortedTracks<TOnlyIds extends boolean | undefined = false>(
  onlyIds?: TOnlyIds,
  sortOptions?: TracksSortOptions
) {
  const orderBy =
    sortOptions?.order === "dateAdded"
      ? sortOptions.isAsc
        ? asc(tracks.dateAdded)
        : desc(tracks.dateAdded)
      : sortOptions?.isAsc === false
        ? desc(sql`lower(coalesce(${tracks.title}, ''))`)
        : asc(sql`lower(coalesce(${tracks.title}, ''))`)

  const rows = await db.query.tracks.findMany({
    where: eq(tracks.isDeleted, 0),
    with: {
      artist: true,
      album: { with: { artist: true } },
      featuredArtists: { with: { artist: true } },
      genres: { with: { genre: true } },
    },
    orderBy,
  })

  if (onlyIds) {
    return rows.map((row) => ({ id: row.id })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : SortedTrack[]
  }

  return rows.map(toDataTrack) as TOnlyIds extends true ? Array<{ id: string }> : SortedTrack[]
}

export async function getTracks(conditions?: DrizzleFilter) {
  const rows = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), ...(conditions ?? [])),
    with: {
      artist: true,
      album: { with: { artist: true } },
      featuredArtists: { with: { artist: true } },
      genres: { with: { genre: true } },
    },
    orderBy: asc(sql`lower(coalesce(${tracks.title}, ''))`),
  })

  return rows.map(toDataTrack) satisfies BulkQueriedTrack[]
}

export async function updateTrack(id: string, values: Partial<typeof tracks.$inferInsert>) {
  return db.update(tracks).set(values).where(eq(tracks.id, id))
}

export function toggleTrackInPlaylist(entry: typeof playlistTracks.$inferInsert) {
  return db.transaction(async (tx) => {
    const condition = and(
      eq(playlistTracks.playlistId, entry.playlistId),
      eq(playlistTracks.trackId, entry.trackId)
    )

    if (await tx.query.playlistTracks.findFirst({ where: condition })) {
      await tx.delete(playlistTracks).where(condition)
      return
    }

    await tx.insert(playlistTracks).values(entry)
  })
}

export function upsertTracks(entries: Array<typeof tracks.$inferInsert>) {
  return db
    .insert(tracks)
    .values(entries)
    .onConflictDoUpdate({
      target: tracks.id,
      set: {
        title: sql`excluded.title`,
        artistId: sql`excluded.artist_id`,
        albumId: sql`excluded.album_id`,
        duration: sql`excluded.duration`,
        uri: sql`excluded.uri`,
        filename: sql`excluded.filename`,
        dateAdded: sql`excluded.date_added`,
        scanTime: sql`excluded.scan_time`,
        artwork: sql`excluded.artwork`,
        updatedAt: Date.now(),
      },
    })
}

export async function deleteTracks(
  entries: Array<{ id: string; errorInfo?: { errorName: string; errorMessage: string } }>
) {
  return db.transaction(async (tx) => {
    const removedIds = entries.map(({ id }) => id)
    await Promise.all(
      trackRelationTables.map((table) => tx.delete(table).where(inArray(table.trackId, removedIds)))
    )
    await tx.delete(tracks).where(inArray(tracks.id, removedIds))
  })
}

export async function addPlayedTrack(trackUri: string) {
  const row = await db.query.tracks.findFirst({ where: eq(tracks.uri, trackUri) })
  if (!row) {
    return
  }

  const now = Date.now()
  await db
    .update(tracks)
    .set({
      playCount: sql`${tracks.playCount} + 1`,
      lastPlayedAt: now,
    })
    .where(eq(tracks.id, row.id))
  await db.insert(playHistory).values({ id: `${row.id}-${now}`, trackId: row.id, playedAt: now })
}
