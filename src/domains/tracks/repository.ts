import { and, asc, eq, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

import { db } from "@/core/db"
import { playHistory, tracks } from "@/core/db/schema"
import { getPreferenceState } from "@/core/preferences/store"

import { formatArtistsForDisplay, splitArtistsValue } from "./split-engine"
import type { DataTrack } from "./types"

interface TrackRow {
  id: string
  title: string
  artwork: string | null
  albumId: string | null
  uri: string
  duration: number
  dateAdded: number | null
  scanTime: number | null
  rawArtist: string | null
  albumName?: string | null
  artistName?: string | null
}

export function toDataTrack(row: TrackRow): DataTrack {
  let displayArtistName = row.artistName ?? null
  let displayArtists = row.artistName ? [row.artistName] : null

  if (row.artistName) {
    const splitConfig = getPreferenceState().splitMultipleValueConfig
    const splitNames = splitArtistsValue(row.artistName, splitConfig)
    displayArtists = splitNames
    displayArtistName = formatArtistsForDisplay(
      row.artistName,
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
    albumName: row.albumName ?? null,
    albumId: row.albumId ?? null,
    uri: row.uri,
    duration: row.duration,
    discoverTime: row.dateAdded ?? null,
    modificationTime: row.scanTime ?? null,
    rawArtistName: row.rawArtist ?? null,
    parentFolder: row.uri.split("/").slice(0, -1).join("/") || null,
  }
}

const trackWithRelations = {
  artist: true,
  album: { with: { artist: true } },
  featuredArtists: { with: { artist: true } },
  genres: { with: { genre: true } },
} as const

function toTrackRow(row: NonNullable<Awaited<ReturnType<typeof findTrackRow>>>): TrackRow {
  return {
    id: row.id,
    title: row.title,
    artwork: row.artwork,
    albumId: row.albumId,
    uri: row.uri,
    duration: row.duration,
    dateAdded: row.dateAdded,
    scanTime: row.scanTime,
    rawArtist: row.rawArtist,
    albumName: row.album?.title ?? null,
    artistName: row.artist?.name ?? null,
  }
}

function findTrackRow(id: string) {
  return db.query.tracks.findFirst({
    where: and(eq(tracks.id, id), eq(tracks.isDeleted, 0)),
    with: trackWithRelations,
  })
}

export async function maybeGetTrack(id: string): Promise<DataTrack | null> {
  const row = await findTrackRow(id)
  if (!row) {
    return null
  }

  return toDataTrack(toTrackRow(row))
}

export async function addPlayedTrack(trackUri: string): Promise<string | undefined> {
  const row = await db.query.tracks.findFirst({ where: eq(tracks.uri, trackUri) })
  if (!row) {
    return undefined
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

  return row.id
}

export async function getAllTrackIds(): Promise<Array<{ id: string }>> {
  const rows = await db.query.tracks.findMany({
    where: eq(tracks.isDeleted, 0),
    orderBy: [asc(tracks.title)],
    columns: { id: true },
  })
  return rows.map((r) => ({ id: r.id }))
}
