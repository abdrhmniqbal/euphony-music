/**
 * Purpose: Provides track read/write access for library lists, detail views, favorites, and playback history.
 * Caller: tracks queries, tracks mutations, player activity services, library screens.
 * Dependencies: Drizzle database client, tracks table, track_artists table, play_history table.
 * Main Functions: listTracks(), getTrackById(), setTrackFavoriteStatus(), incrementTrackPlayCount()
 * Side Effects: Reads tracks from DB; writes favorite status, play counts, and play history records.
 */

import { and, asc, desc, eq, like, or, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { playHistory, trackArtists, tracks } from "@/db/schema"

import type { TrackFilter } from "./types"

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
      filters?.searchQuery
        ? like(tracks.title, `%${filters.searchQuery}%`)
        : undefined
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
    id: `${trackId}-${now}`,
    trackId,
    playedAt: now,
  })

  return trackId
}
