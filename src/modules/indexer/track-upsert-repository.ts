import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { tracks, trackGenres, trackArtists } from "@/db/schema"
import {
  type IndexingLookupCache,
  getOrCreateArtist,
  getOrCreateAlbum,
  getOrCreateGenre,
} from "./lookup-cache-repository"
import type { PreparedAssetForIndex } from "./prepared-assets"

export async function upsertPreparedAsset(
  prepared: PreparedAssetForIndex,
  signal?: AbortSignal,
  lookupCache?: IndexingLookupCache
): Promise<void> {
  const { asset, fileHash, metadata, artworkPath } = prepared
  if (signal?.aborted) {
    return
  }

  const artistId = metadata.artist ? await getOrCreateArtist(metadata.artist, lookupCache) : null
  const relationArtistNames = metadata.artists.length
    ? metadata.artists
    : metadata.artist
      ? [metadata.artist]
      : []
  const relationArtistIds = Array.from(
    new Set(
      await Promise.all(
        [...relationArtistNames, metadata.artist ?? ""]
          .filter((artist): artist is string => Boolean(artist))
          .map((artist) => getOrCreateArtist(artist, lookupCache))
      )
    )
  )

  const albumArtistId =
    metadata.albumArtist && metadata.albumArtist !== metadata.artist
      ? await getOrCreateArtist(metadata.albumArtist, lookupCache)
      : artistId

  const albumId =
    metadata.album && albumArtistId
      ? await getOrCreateAlbum(
          metadata.album,
          albumArtistId,
          artworkPath,
          metadata.year,
          lookupCache
        )
      : null

  const genresToProcess = metadata.genres.length > 0 ? metadata.genres : ["Unknown"]
  const genreIds = await Promise.all(
    genresToProcess.map((genre) => getOrCreateGenre(genre, lookupCache))
  )
  if (signal?.aborted) {
    return
  }

  const now = Date.now()
  await db
    .insert(tracks)
    .values({
      id: asset.id,
      title: metadata.title,
      artistId,
      albumId,
      duration: metadata.duration,
      uri: asset.uri,
      trackNumber: metadata.trackNumber,
      discNumber: metadata.discNumber,
      year: metadata.year,
      filename: asset.filename || "",
      fileHash,
      audioBitrate: metadata.bitrate || null,
      audioSampleRate: metadata.sampleRate || null,
      audioCodec: metadata.codec || null,
      audioFormat: metadata.format || null,
      artwork: artworkPath || null,
      lyrics: metadata.lyrics || null,
      composer: metadata.composer || null,
      comment: metadata.comment || null,
      rawArtist: metadata.rawArtist || null,
      rawAlbumArtist: metadata.rawAlbumArtist || null,
      rawGenre: metadata.rawGenre || null,
      dateAdded: asset.creationTime || now,
      scanTime: now,
      isDeleted: 0,
      isFavorite: 0,
      playCount: 0,
      rating: null,
      lastPlayedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tracks.id,
      set: {
        title: metadata.title,
        artistId,
        albumId,
        duration: metadata.duration,
        trackNumber: metadata.trackNumber,
        discNumber: metadata.discNumber,
        year: metadata.year,
        fileHash,
        audioBitrate: metadata.bitrate || null,
        audioSampleRate: metadata.sampleRate || null,
        audioCodec: metadata.codec || null,
        audioFormat: metadata.format || null,
        artwork: artworkPath || null,
        lyrics: metadata.lyrics || null,
        composer: metadata.composer || null,
        comment: metadata.comment || null,
        rawArtist: metadata.rawArtist || null,
        rawAlbumArtist: metadata.rawAlbumArtist || null,
        rawGenre: metadata.rawGenre || null,
        scanTime: now,
        isDeleted: 0,
        updatedAt: now,
      },
    })

  if (signal?.aborted) {
    return
  }

  if (genreIds.length === 0) {
    return
  }

  await db.delete(trackGenres).where(eq(trackGenres.trackId, asset.id))
  await db.delete(trackArtists).where(eq(trackArtists.trackId, asset.id))
  if (signal?.aborted) {
    return
  }

  if (relationArtistIds.length > 0) {
    await db.insert(trackArtists).values(
      relationArtistIds.map((relationArtistId) => ({
        trackId: asset.id,
        artistId: relationArtistId,
      }))
    )
  }

  await db.insert(trackGenres).values(
    genreIds.map((genreId) => ({
      trackId: asset.id,
      genreId,
    }))
  )
}
