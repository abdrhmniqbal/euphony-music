import { db } from "@/db/client"
import {
  albums,
  artists,
  genres,
  trackArtists,
  trackGenres,
  tracks as tracksTable,
} from "@/db/schema"
import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm"
import { generateSortName } from "@/modules/indexer/file-identity"
import { extractMetadata, saveArtworkToCache } from "@/modules/indexer/metadata"
import { logWarn } from "@/modules/logging/service"
import { ensureSplitMultipleValueConfigLoaded } from "@/modules/settings/split-multiple-values"
import { generateId } from "@/utils/common"
import { transformDBTrackToTrack } from "@/utils/transformers"
import { getTracksState } from "@/modules/player/store"
import { EXTERNAL_TRACK_ID_PREFIX, type Track } from "@/modules/player/types"
import {
  extractExternalUriTrackIds,
  getExternalFilename,
  getExternalTrackTitle,
  hashExternalTrackId,
  normalizeUriForComparison,
} from "@/modules/player/external-track-utils"

async function getOrCreateExternalArtist(name: string) {
  const existing = await db.query.artists.findFirst({
    where: eq(artists.name, name),
  })

  if (existing) {
    return existing.id
  }

  const id = generateId()
  await db.insert(artists).values({
    id,
    name,
    sortName: generateSortName(name),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  return id
}

async function getOrCreateExternalAlbum(
  title: string,
  artistId: string,
  artwork?: string,
  year?: number
) {
  const existing = await db.query.albums.findFirst({
    where: and(eq(albums.title, title), eq(albums.artistId, artistId)),
  })

  if (existing) {
    return existing.id
  }

  const id = generateId()
  await db.insert(albums).values({
    id,
    title,
    artistId,
    year: year || null,
    artwork: artwork || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  return id
}

async function getOrCreateExternalGenre(name: string) {
  const existing = await db.query.genres.findFirst({
    where: eq(genres.name, name),
  })

  if (existing) {
    return existing.id
  }

  const id = generateId()
  await db.insert(genres).values({
    id,
    name,
    createdAt: Date.now(),
  })

  return id
}

async function updateExternalLibraryCounts() {
  await db.run(sql`
    UPDATE artists
    SET track_count = (
      SELECT COUNT(DISTINCT t.id)
      FROM tracks t
      LEFT JOIN track_artists ta ON ta.track_id = t.id
      WHERE t.is_deleted = 0
        AND (t.artist_id = artists.id OR ta.artist_id = artists.id)
    )
  `)
  await db.run(sql`
    UPDATE albums
    SET track_count = (
      SELECT COUNT(*)
      FROM tracks t
      WHERE t.album_id = albums.id AND t.is_deleted = 0
    ),
    duration = (
      SELECT COALESCE(SUM(t.duration), 0)
      FROM tracks t
      WHERE t.album_id = albums.id AND t.is_deleted = 0
    )
  `)
  await db.run(sql`
    UPDATE genres
    SET track_count = (
      SELECT COUNT(*)
      FROM track_genres tg
      JOIN tracks t ON tg.track_id = t.id
      WHERE tg.genre_id = genres.id AND t.is_deleted = 0
    )
  `)
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
    const splitConfig = await ensureSplitMultipleValueConfigLoaded()
    const metadata = await extractMetadata(playableUri, getExternalFilename(uri), 0, splitConfig)
    const artworkPath = await saveArtworkToCache(metadata.artwork)

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

  const splitConfig = await ensureSplitMultipleValueConfigLoaded()
  const metadata = await extractMetadata(playableUri, getExternalFilename(uri), 0, splitConfig)
  const artworkPath = await saveArtworkToCache(metadata.artwork)
  const artistId = metadata.artist ? await getOrCreateExternalArtist(metadata.artist) : null
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
          .map((artist) => getOrCreateExternalArtist(artist))
      )
    )
  )
  const albumArtistId =
    metadata.albumArtist && metadata.albumArtist !== metadata.artist
      ? await getOrCreateExternalArtist(metadata.albumArtist)
      : artistId
  const albumId =
    metadata.album && albumArtistId
      ? await getOrCreateExternalAlbum(metadata.album, albumArtistId, artworkPath, metadata.year)
      : null
  const genreNames = metadata.genres.length > 0 ? metadata.genres : ["Unknown"]
  const genreIds = await Promise.all(genreNames.map((genre) => getOrCreateExternalGenre(genre)))
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
