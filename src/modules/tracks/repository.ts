/**
 * Purpose: Provides track read/write access for library lists, detail views, favorites, and playback history.
 * Caller: tracks queries, tracks mutations, player activity services, library screens.
 * Dependencies: Drizzle database client, tracks table, track_artists table, play_history table.
 * Main Functions: listTracks(), getTrackById(), setTrackFavoriteStatus(), incrementTrackPlayCount()
 * Side Effects: Reads tracks from DB; writes favorite status, play counts, and play history records.
 */

import { createId } from "@paralleldrive/cuid2"
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { playHistory, playlistTracks, trackArtists, trackGenres, tracks } from "@/db/schema"
import { getSettingsState } from "@/modules/settings/store"
import {
  formatArtistsForDisplay,
  splitArtistsValue,
} from "@/modules/settings/split-multiple-values"

import type { DrizzleFilter, TracksSortOptions } from "@/modules/library/data-types"
import type { BulkQueriedTrack, SortedTrack, Track, TrackFilter } from "./types"

export async function listTracks(filters?: TrackFilter) {
  const sortField = filters?.sortBy || "title"
  const sortOrder = filters?.sortOrder || "asc"
  const multiplier = sortOrder === "asc" ? 1 : -1
  const orderByDirection = sortOrder === "asc" ? asc : desc

  const dbOrderBy =
    sortField === "title"
      ? [orderByDirection(sql`lower(coalesce(${tracks.title}, ''))`)]
      : sortField === "dateAdded"
        ? [orderByDirection(tracks.dateAdded)]
        : sortField === "playCount"
          ? [orderByDirection(tracks.playCount)]
          : sortField === "rating"
            ? [orderByDirection(tracks.rating)]
            : []

  const results = await db.query.tracks.findMany({
    where: and(
      eq(tracks.isDeleted, 0),
      filters?.artistId
        ? or(
            eq(tracks.artistId, filters.artistId),
            sql`${tracks.id} IN (
              SELECT ${trackArtists.trackId}
              FROM ${trackArtists}
              WHERE ${trackArtists.artistId} = ${filters.artistId}
            )`
          )
        : undefined,
      filters?.albumId ? eq(tracks.albumId, filters.albumId) : undefined,
      filters?.isFavorite ? eq(tracks.isFavorite, 1) : undefined,
      filters?.searchQuery ? like(tracks.title, `%${filters.searchQuery}%`) : undefined
    ),
    with: {
      artist: true,
      featuredArtists: {
        with: {
          artist: true,
        },
      },
      album: {
        with: {
          artist: true,
        },
      },
      genres: {
        with: {
          genre: true,
        },
      },
    },
    orderBy: dbOrderBy.length > 0 ? dbOrderBy : undefined,
  })

  if (dbOrderBy.length > 0) {
    return results
  }

  return results.sort((a, b) => {
    let aVal: string | number | null = null
    let bVal: string | number | null = null

    switch (sortField) {
      case "title":
        aVal = a.title.toLowerCase()
        bVal = b.title.toLowerCase()
        break
      case "artist":
        aVal = a.artist?.name?.toLowerCase() || ""
        bVal = b.artist?.name?.toLowerCase() || ""
        break
      case "album":
        aVal = a.album?.title?.toLowerCase() || ""
        bVal = b.album?.title?.toLowerCase() || ""
        break
      case "dateAdded":
        aVal = a.dateAdded || 0
        bVal = b.dateAdded || 0
        break
      case "playCount":
        aVal = a.playCount || 0
        bVal = b.playCount || 0
        break
      case "rating":
        aVal = a.rating || 0
        bVal = b.rating || 0
        break
    }

    if (aVal === null || bVal === null) {
      return 0
    }

    if (aVal < bVal) {
      return -1 * multiplier
    }

    if (aVal > bVal) {
      return 1 * multiplier
    }

    return 0
  })
}

export async function getTrackById(id: string) {
  const track = await db.query.tracks.findFirst({
    where: and(eq(tracks.id, id), eq(tracks.isDeleted, 0)),
    with: {
      artist: true,
      album: {
        with: {
          artist: true,
        },
      },
      featuredArtists: {
        with: {
          artist: true,
        },
      },
      genres: {
        with: {
          genre: true,
        },
      },
    },
  })

  return track ?? null
}

export async function setTrackFavoriteStatus({
  trackId,
  isFavorite,
}: {
  trackId: string
  isFavorite: boolean
}) {
  await db
    .update(tracks)
    .set({ isFavorite: isFavorite ? 1 : 0 })
    .where(eq(tracks.id, trackId))

  return { trackId, isFavorite }
}

export async function incrementTrackPlayCount(trackId: string) {
  const now = Date.now()

  await db
    .update(tracks)
    .set({
      playCount: sql`${tracks.playCount} + 1`,
      lastPlayedAt: now,
    })
    .where(eq(tracks.id, trackId))

  await db.insert(playHistory).values({
    id: createId(),
    trackId,
    playedAt: now,
  })

  return trackId
}

const trackRelationTables = [trackArtists, trackGenres, playlistTracks, playHistory] as const

type TrackRow = typeof tracks.$inferSelect & {
  artist?: { name: string } | null
  album?: { title: string; artist?: { name: string } | null } | null
}

function toDataTrack(row: TrackRow): Track {
  let displayArtistName = row.artist?.name ?? null
  let displayArtists = row.artist?.name ? [row.artist.name] : null

  if (row.artist?.name) {
    const splitConfig = getSettingsState().splitMultipleValueConfig
    const splitNames = splitArtistsValue(row.artist.name, splitConfig)
    displayArtists = splitNames
    displayArtistName = formatArtistsForDisplay(
      row.artist.name,
      splitNames,
      splitConfig.artistSplitMode
    )
  }

  return {
    id: row.id,
    name: row.title,
    artwork: row.artwork ?? null,
    artists: displayArtists,
    artistName: displayArtistName,
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

export async function maybeGetTrack(id: string): Promise<Track | null> {
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
    return null
  }

  return toDataTrack(row)
}

export async function getTrack(id: string): Promise<Track> {
  const track = await maybeGetTrack(id)
  if (!track) {
    throw new Error("err.msg.noTracks")
  }
  return track
}

export async function getTracksByIds(ids: string[]): Promise<Track[]> {
  const uniqueIds = Array.from(new Set(ids)).filter((id) => id.length > 0)
  if (uniqueIds.length === 0) {
    return []
  }

  const rows = await db.query.tracks.findMany({
    where: and(inArray(tracks.id, uniqueIds), eq(tracks.isDeleted, 0)),
    with: {
      artist: true,
      album: { with: { artist: true } },
      featuredArtists: { with: { artist: true } },
      genres: { with: { genre: true } },
    },
  })

  return rows.map(toDataTrack)
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
  await db.insert(playHistory).values({ id: createId(), trackId: row.id, playedAt: now })
}
