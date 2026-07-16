import { db } from "@/db/client"
import {
  trackArtists,
  trackGenres,
  tracks as tracksTable,
} from "@/db/schema"
import { and, eq, inArray, or, type SQL } from "drizzle-orm"
import { extractMetadata, saveArtworkToCache } from "@/modules/indexer/metadata/metadata"
import { logWarn } from "@/modules/logging/service"
import { ensureSplitMultipleValueConfigLoaded } from "@/modules/settings/split-multiple-values"
import { transformDBTrackToTrack } from "@/utils/transformers"
import { getTracksState } from "@/modules/player/store"
import { EXTERNAL_TRACK_ID_PREFIX, type Track } from "@/modules/player/types"
import {
  getOrCreateArtist,
  getOrCreateAlbum,
  getOrCreateGenre,
} from "@/modules/indexer/scan/upsert"
import {
  updateArtistCounts,
  updateAlbumCounts,
  updateGenreCounts,
} from "@/modules/indexer/scan/maintenance"
import {
  extractExternalUriTrackIds,
  getExternalFilename,
  getExternalTrackTitle,
  hashExternalTrackId,
  normalizeUriForComparison,
} from "@/modules/player/external-track-utils"

async function updateExternalLibraryCounts() {
  await updateArtistCounts()
  await updateAlbumCounts()
  await updateGenreCounts()
}

async function extractExternalFileMetadata(uri: string, resolvedUri: string) {
  const playableUri = resolvedUri || uri
  const splitConfig = await ensureSplitMultipleValueConfigLoaded()
  const metadata = await extractMetadata(playableUri, getExternalFilename(uri), 0, splitConfig)
  const artworkPath = await saveArtworkToCache(metadata.artwork)
  return { playableUri, metadata, artworkPath }
}

export async function buildExternalTrack(uri: string, resolvedUri: string): Promise<Track> {
  const fallbackTitle = getExternalTrackTitle(uri)
  const playableUri = resolvedUri || uri
  const fallbackTrack: Track = {
    id: `${EXTERNAL_TRACK_ID_PREFIX}${Date.now()}:${playableUri}`,
    title: fallbackTitle,
    duration: 0,
    uri: playableUri,
    isExternal: true,
  }

  try {
    const { metadata, artworkPath } = await extractExternalFileMetadata(uri, resolvedUri)

    return {
      ...fallbackTrack,
      title: metadata.title || fallbackTitle,
      artist: metadata.artist,
      albumArtist: metadata.albumArtist,
      album: metadata.album,
      duration: metadata.duration,
      image: artworkPath,
      albumArtwork: artworkPath,
      audioBitrate: metadata.bitrate,
      audioSampleRate: metadata.sampleRate,
      audioCodec: metadata.codec,
      audioFormat: metadata.format,
      lyrics: metadata.lyrics,
      year: metadata.year,
      discNumber: metadata.discNumber,
      trackNumber: metadata.trackNumber,
      genre: metadata.genres[0],
    }
  } catch (error) {
    logWarn("Failed to read external file metadata", {
      uri: playableUri,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return {
    ...fallbackTrack,
  }
}

export async function findIndexedTrackForExternalUri(uri: string, resolvedUri: string) {
  const uriCandidates = new Set([
    normalizeUriForComparison(uri),
    normalizeUriForComparison(resolvedUri),
  ])
  const idCandidates = new Set([
    ...extractExternalUriTrackIds(uri),
    ...extractExternalUriTrackIds(resolvedUri),
  ])

  const cachedTrack = getTracksState().find((track) => {
    if (!track.id || !track.uri || track.isDeleted || track.isExternal) {
      return false
    }

    return idCandidates.has(track.id) || uriCandidates.has(normalizeUriForComparison(track.uri))
  })

  if (cachedTrack) {
    return cachedTrack
  }

  const candidateIds = Array.from(idCandidates).filter(Boolean)
  const candidateUris = Array.from(new Set([uri, resolvedUri, ...uriCandidates].filter(Boolean)))
  const conditions: SQL[] = []
  if (candidateIds.length > 0) {
    conditions.push(inArray(tracksTable.id, candidateIds))
  }
  if (candidateUris.length > 0) {
    conditions.push(inArray(tracksTable.uri, candidateUris))
  }

  if (conditions.length === 0) {
    return undefined
  }

  const trackMatchCondition = conditions.length === 1 ? conditions[0]! : or(...conditions)

  const track = await db.query.tracks.findFirst({
    where: and(eq(tracksTable.isDeleted, 0), trackMatchCondition),
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

  return track ? transformDBTrackToTrack(track) : undefined
}

export async function indexExternalFileTrack(uri: string, resolvedUri: string) {
  const playableUri = resolvedUri || uri
  const trackId =
    Array.from(extractExternalUriTrackIds(uri))[0] ||
    hashExternalTrackId(normalizeUriForComparison(playableUri || uri))
  const existingTrack = await findIndexedTrackForExternalUri(uri, resolvedUri)

  if (existingTrack) {
    return existingTrack
  }

  const { metadata, artworkPath } = await extractExternalFileMetadata(uri, resolvedUri)
  const artistId = metadata.artist ? await getOrCreateArtist(metadata.artist) : null
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
          .map((artist) => getOrCreateArtist(artist))
      )
    )
  )
  const albumArtistId =
    metadata.albumArtist && metadata.albumArtist !== metadata.artist
      ? await getOrCreateArtist(metadata.albumArtist)
      : artistId
  const albumId =
    metadata.album && albumArtistId
      ? await getOrCreateAlbum(metadata.album, albumArtistId, artworkPath, metadata.year)
      : null
  const genreNames = metadata.genres.length > 0 ? metadata.genres : ["Unknown"]
  const genreIds = await Promise.all(genreNames.map((genre) => getOrCreateGenre(genre)))
  const now = Date.now()

  await db
    .insert(tracksTable)
    .values({
      id: trackId,
      title: metadata.title || getExternalTrackTitle(uri),
      artistId,
      albumId,
      duration: metadata.duration,
      uri: playableUri,
      trackNumber: metadata.trackNumber,
      discNumber: metadata.discNumber,
      year: metadata.year,
      filename: getExternalFilename(uri),
      fileHash: hashExternalTrackId(normalizeUriForComparison(playableUri)),
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
      dateAdded: now,
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
      target: tracksTable.id,
      set: {
        title: metadata.title || getExternalTrackTitle(uri),
        artistId,
        albumId,
        duration: metadata.duration,
        uri: playableUri,
        trackNumber: metadata.trackNumber,
        discNumber: metadata.discNumber,
        year: metadata.year,
        filename: getExternalFilename(uri),
        fileHash: hashExternalTrackId(normalizeUriForComparison(playableUri)),
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

  await db.delete(trackGenres).where(eq(trackGenres.trackId, trackId))
  await db.delete(trackArtists).where(eq(trackArtists.trackId, trackId))

  if (relationArtistIds.length > 0) {
    await db.insert(trackArtists).values(
      relationArtistIds.map((artistIdValue) => ({
        trackId,
        artistId: artistIdValue,
      }))
    )
  }

  if (genreIds.length > 0) {
    await db.insert(trackGenres).values(
      genreIds.map((genreId) => ({
        trackId,
        genreId,
      }))
    )
  }

  await updateExternalLibraryCounts()

  const indexedTrack = await findIndexedTrackForExternalUri(uri, resolvedUri)
  if (!indexedTrack) {
    throw new Error("External file was indexed but could not be read back")
  }

  return indexedTrack
}
