/**
 * Purpose: Resolves representative artwork for albums from their indexed tracks.
 * Caller: Library repository album listing/detail hydration.
 * Dependencies: Drizzle DB client and track schema.
 * Main Functions: selectDominantArtwork(), getDominantAlbumArtworkMap()
 * Side Effects: Reads track artwork rows from SQLite.
 */

import { and, eq, inArray, isNotNull } from "drizzle-orm"

import { db } from "@/db/client"
import { tracks } from "@/db/schema"

export function selectDominantArtwork(
  tracksForAlbum: Array<{ artwork: string | null; dateAdded?: number | null }>
) {
  const artworkStats = new Map<string, { count: number; latestDateAdded: number }>()

  for (const track of tracksForAlbum) {
    const artwork = track.artwork
    if (!artwork) {
      continue
    }

    const existing = artworkStats.get(artwork)
    const dateAdded = track.dateAdded ?? 0

    if (!existing) {
      artworkStats.set(artwork, {
        count: 1,
        latestDateAdded: dateAdded,
      })
      continue
    }

    existing.count += 1
    existing.latestDateAdded = Math.max(existing.latestDateAdded, dateAdded)
  }

  let dominantArtwork: string | undefined
  let dominantCount = -1
  let dominantLatestDateAdded = -1

  for (const [artwork, stats] of artworkStats.entries()) {
    if (
      stats.count > dominantCount ||
      (stats.count === dominantCount &&
        stats.latestDateAdded > dominantLatestDateAdded)
    ) {
      dominantArtwork = artwork
      dominantCount = stats.count
      dominantLatestDateAdded = stats.latestDateAdded
    }
  }

  return dominantArtwork
}

export async function getDominantAlbumArtworkMap(albumIds: string[]) {
  if (albumIds.length === 0) {
    return new Map<string, string>()
  }

  const albumTracks = await db.query.tracks.findMany({
    where: and(
      eq(tracks.isDeleted, 0),
      inArray(tracks.albumId, albumIds),
      isNotNull(tracks.artwork)
    ),
    columns: {
      albumId: true,
      artwork: true,
      dateAdded: true,
    },
  })

  const tracksByAlbumId = new Map<
    string,
    Array<{ artwork: string | null; dateAdded?: number | null }>
  >()

  for (const track of albumTracks) {
    const albumId = track.albumId
    if (!albumId) {
      continue
    }

    const bucket = tracksByAlbumId.get(albumId)
    if (bucket) {
      bucket.push(track)
      continue
    }

    tracksByAlbumId.set(albumId, [track])
  }

  const dominantArtworkByAlbumId = new Map<string, string>()
  for (const [albumId, tracksForAlbum] of tracksByAlbumId.entries()) {
    const dominantArtwork = selectDominantArtwork(tracksForAlbum)
    if (dominantArtwork) {
      dominantArtworkByAlbumId.set(albumId, dominantArtwork)
    }
  }

  return dominantArtworkByAlbumId
}
