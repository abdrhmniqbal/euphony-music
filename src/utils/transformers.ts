/**
 * Purpose: Converts Drizzle database result shapes into app-facing player/library domain models.
 * Caller: Track, library, history, genre, playlist, and player repositories.
 * Dependencies: Player domain types and database result types.
 * Main Functions: transformDBTrackToTrack(), transformDBAlbumToAlbum(), transformDBArtistToArtist().
 * Side Effects: None.
 */

import type { Album, Artist, Track } from "@/modules/player/types"
import type { DBAlbum, DBArtist, DBTrack } from "@/types/database"

function joinUniqueValues(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = value?.trim()
    if (!normalized) {
      continue
    }

    const key = normalized.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(normalized)
  }

  return result.join(", ")
}

export function transformDBTrackToTrack(dbTrack: DBTrack): Track {
  const artist = joinUniqueValues([
    dbTrack.artist?.name,
    ...(dbTrack.featuredArtists?.map((entry) => entry.artist?.name) ?? []),
  ])
  const albumArtist = dbTrack.album?.artist?.name?.trim() || artist
  const genre = joinUniqueValues(dbTrack.genres?.map((entry) => entry.genre?.name) ?? [])

  return {
    id: dbTrack.id,
    title: dbTrack.title,
    artist: artist || undefined,
    artistId: dbTrack.artistId || undefined,
    albumArtist: albumArtist || undefined,
    album: dbTrack.album?.title,
    albumId: dbTrack.albumId || undefined,
    duration: dbTrack.duration,
    uri: dbTrack.uri,
    image: dbTrack.artwork || dbTrack.album?.artwork || undefined,
    albumArtwork: dbTrack.album?.artwork || undefined,
    audioBitrate: dbTrack.audioBitrate || undefined,
    audioSampleRate: dbTrack.audioSampleRate || undefined,
    audioCodec: dbTrack.audioCodec || undefined,
    audioFormat: dbTrack.audioFormat || undefined,
    lyrics: (dbTrack.lyrics || undefined)?.replace(/^\uFEFF/, ""),
    fileHash: dbTrack.fileHash || undefined,
    scanTime: dbTrack.scanTime || undefined,
    isDeleted: Boolean(dbTrack.isDeleted),
    playCount: dbTrack.playCount || 0,
    lastPlayedAt: dbTrack.lastPlayedAt || undefined,
    year: dbTrack.year || undefined,
    filename: dbTrack.filename || undefined,
    dateAdded: dbTrack.dateAdded || undefined,
    isFavorite: Boolean(dbTrack.isFavorite),
    discNumber: dbTrack.discNumber || undefined,
    trackNumber: dbTrack.trackNumber || undefined,
    genre: genre || undefined,
  }
}

export function transformDBAlbumToAlbum(dbAlbum: DBAlbum): Album {
  return {
    id: dbAlbum.id,
    title: dbAlbum.title,
    artist: dbAlbum.artist?.name || "Unknown Artist",
    albumArtist: dbAlbum.artist?.name,
    image: dbAlbum.artwork || undefined,
    trackCount: dbAlbum.trackCount || 0,
    year: dbAlbum.year || 0,
    dateAdded: dbAlbum.createdAt,
  }
}

export function transformDBArtistToArtist(dbArtist: DBArtist): Artist {
  return {
    id: dbArtist.id,
    name: dbArtist.name,
    trackCount: dbArtist.trackCount || 0,
    image: dbArtist.artwork || undefined,
    dateAdded: dbArtist.createdAt,
  }
}
