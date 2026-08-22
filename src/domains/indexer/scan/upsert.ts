import { and, eq } from "drizzle-orm"
import { db } from "@/core/db"
import { albums, artists, genres, trackArtists, trackGenres, tracks } from "@/core/db/schema"
import { generateId } from "@/lib/id"
import { logWarn } from "@/core/log/service"
import {
  GENRE_COLORS,
  GENRE_SHAPES,
  getGenreRainbowColor,
  getGenreShape,
  type GenreShape,
} from "@/domains/genres/constants"
import type { PreparedAssetForIndex } from "./batch"
import { generateSortName } from "./file-identity"

// --- Lookup cache -----------------------------------------------------------

export interface GenreVisualLookup {
  supportsVisualColumns: boolean
  usedCombinations: Set<string>
  colorUsage: Map<string, number>
  shapeUsage: Map<GenreShape, number>
}

export interface IndexingLookupCache {
  artistIdsByName: Map<string, string>
  albumIdsByArtistAndTitle: Map<string, string>
  genreIdsByName: Map<string, string>
  genreVisuals: GenreVisualLookup
}

function createEmptyGenreVisualLookup(): GenreVisualLookup {
  const colorUsage = new Map<string, number>()
  const shapeUsage = new Map<GenreShape, number>()

  for (const color of GENRE_COLORS) {
    colorUsage.set(color, 0)
  }
  for (const shape of GENRE_SHAPES) {
    shapeUsage.set(shape, 0)
  }

  return {
    supportsVisualColumns: true,
    usedCombinations: new Set(),
    colorUsage,
    shapeUsage,
  }
}

function registerGenreVisual(visualLookup: GenreVisualLookup, color: string, shape: GenreShape) {
  visualLookup.usedCombinations.add(`${color}::${shape}`)
  visualLookup.colorUsage.set(color, (visualLookup.colorUsage.get(color) ?? 0) + 1)
  visualLookup.shapeUsage.set(shape, (visualLookup.shapeUsage.get(shape) ?? 0) + 1)
}

function selectGenreVisuals(
  name: string,
  visualLookup?: GenreVisualLookup
): { color: string; shape: GenreShape } {
  const color = getGenreRainbowColor(name)

  if (!visualLookup?.supportsVisualColumns) {
    return { color, shape: getGenreShape(name) }
  }

  const { shapeUsage, usedCombinations } = visualLookup
  const shapesByUsage = [...GENRE_SHAPES].sort(
    (a, b) => (shapeUsage.get(a) ?? 0) - (shapeUsage.get(b) ?? 0)
  )

  for (const shape of shapesByUsage) {
    if (!usedCombinations.has(`${color}::${shape}`)) {
      return { color, shape }
    }
  }

  return { color, shape: getGenreShape(name) }
}

function getAlbumLookupKey(artistId: string, title: string) {
  return `${artistId}::${title}`
}

export async function preloadIndexingLookupCache(): Promise<IndexingLookupCache> {
  const [artistRows, albumRows] = await Promise.all([
    db.query.artists.findMany({ columns: { id: true, name: true } }),
    db.query.albums.findMany({ columns: { id: true, title: true, artistId: true } }),
  ])

  const genreVisuals = createEmptyGenreVisualLookup()
  const genreIdsByName = new Map<string, string>()

  try {
    const genreRows = await db.query.genres.findMany({
      columns: { id: true, name: true, color: true, shape: true },
    })
    for (const genre of genreRows) {
      genreIdsByName.set(genre.name, genre.id)
      registerGenreVisual(genreVisuals, genre.color, genre.shape as GenreShape)
    }
  } catch {
    genreVisuals.supportsVisualColumns = false
    const genreRows = await db.query.genres.findMany({ columns: { id: true, name: true } })
    for (const genre of genreRows) {
      genreIdsByName.set(genre.name, genre.id)
    }
  }

  return {
    artistIdsByName: new Map(artistRows.map((artist) => [artist.name, artist.id])),
    albumIdsByArtistAndTitle: new Map(
      albumRows
        .filter((album) => album.artistId)
        .map((album) => [getAlbumLookupKey(album.artistId as string, album.title), album.id])
    ),
    genreIdsByName,
    genreVisuals,
  }
}

export async function getOrCreateArtist(
  name: string,
  lookupCache?: IndexingLookupCache
): Promise<string> {
  const cachedArtistId = lookupCache?.artistIdsByName.get(name)
  if (cachedArtistId) {
    return cachedArtistId
  }

  const sortName = generateSortName(name)
  const existing = await db.query.artists.findFirst({ where: eq(artists.name, name) })
  if (existing) {
    lookupCache?.artistIdsByName.set(name, existing.id)
    return existing.id
  }

  const id = generateId()
  await db.insert(artists).values({
    id,
    name,
    sortName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  lookupCache?.artistIdsByName.set(name, id)
  return id
}

export async function getOrCreateAlbum(
  title: string,
  artistId: string,
  artwork?: string,
  year?: number,
  lookupCache?: IndexingLookupCache
): Promise<string> {
  const cacheKey = getAlbumLookupKey(artistId, title)
  const cachedAlbumId = lookupCache?.albumIdsByArtistAndTitle.get(cacheKey)
  if (cachedAlbumId) {
    return cachedAlbumId
  }

  const existing = await db.query.albums.findFirst({
    where: and(eq(albums.title, title), eq(albums.artistId, artistId)),
  })
  if (existing) {
    lookupCache?.albumIdsByArtistAndTitle.set(cacheKey, existing.id)
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

  lookupCache?.albumIdsByArtistAndTitle.set(cacheKey, id)
  return id
}

export async function getOrCreateGenre(
  name: string,
  lookupCache?: IndexingLookupCache
): Promise<string> {
  const cachedGenreId = lookupCache?.genreIdsByName.get(name)
  if (cachedGenreId) {
    return cachedGenreId
  }

  const existing = await db.query.genres.findFirst({ where: eq(genres.name, name) })
  if (existing) {
    lookupCache?.genreIdsByName.set(name, existing.id)
    return existing.id
  }

  const id = generateId()
  const { color, shape } = selectGenreVisuals(name, lookupCache?.genreVisuals)
  try {
    await db.insert(genres).values({ id, name, color, shape, createdAt: Date.now() })
  } catch (error) {
    // genre.name is unique; a concurrent insert may have won the race.
    // fall back to a color/shape-less row only on the unique-constraint conflict.
    logWarn("Genre insert conflict, retrying without visual metadata", { name, error })
    await db.insert(genres).values({ id, name, createdAt: Date.now() })
  }

  lookupCache?.genreIdsByName.set(name, id)
  if (lookupCache?.genreVisuals.supportsVisualColumns) {
    registerGenreVisual(lookupCache.genreVisuals, color, shape)
  }

  return id
}

// --- Track references -------------------------------------------------------

interface TrackReferenceInput {
  artist?: string | null
  artists: string[]
  albumArtist?: string | null
  album?: string | null
  year?: number | null
  genres: string[]
  artworkPath?: string | null
}

export interface ResolvedTrackReferences {
  artistId: string | null
  albumId: string | null
  albumArtistId: string | null
  relationArtistIds: string[]
  genreIds: string[]
}

// Both the main scan and the external-file import resolve artist/album/genre
// references the same way. This single helper removes that duplicated block.
export async function resolveTrackReferences(
  input: TrackReferenceInput,
  lookupCache?: IndexingLookupCache
): Promise<ResolvedTrackReferences> {
  const relationArtistNames = input.artists.length
    ? input.artists
    : input.artist
      ? [input.artist]
      : []

  const artistId = relationArtistNames[0]
    ? await getOrCreateArtist(relationArtistNames[0], lookupCache)
    : null

  const relationArtistIds = Array.from(
    new Set(
      await Promise.all(relationArtistNames.map((name) => getOrCreateArtist(name, lookupCache)))
    )
  )

  const albumArtistId =
    input.albumArtist && input.albumArtist !== input.artist
      ? await getOrCreateArtist(input.albumArtist, lookupCache)
      : artistId

  const albumId =
    input.album && albumArtistId
      ? await getOrCreateAlbum(
          input.album,
          albumArtistId,
          input.artworkPath || undefined,
          input.year || undefined,
          lookupCache
        )
      : null

  const genreNames = input.genres.length > 0 ? input.genres : ["Unknown"]
  const genreIds = await Promise.all(
    genreNames.map((genre) => getOrCreateGenre(genre, lookupCache))
  )

  return { artistId, albumId, albumArtistId, relationArtistIds, genreIds }
}

// --- Track upsert -----------------------------------------------------------

export async function upsertPreparedAsset(
  prepared: PreparedAssetForIndex,
  signal?: AbortSignal,
  lookupCache?: IndexingLookupCache
): Promise<void> {
  const { asset, fileHash, metadata, artworkPath } = prepared
  if (signal?.aborted) {
    return
  }

  const { artistId, albumId, relationArtistIds, genreIds } = await resolveTrackReferences(
    {
      artist: metadata.artist,
      artists: metadata.artists,
      albumArtist: metadata.albumArtist,
      album: metadata.album,
      year: metadata.year,
      genres: metadata.genres,
      artworkPath,
    },
    lookupCache
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
