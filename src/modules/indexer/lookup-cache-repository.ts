import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { albums, artists, genres } from "@/db/schema"
import { GENRE_COLORS, GENRE_SHAPES, type GenreShape } from "@/modules/genres/constants"
import { generateId, generateSortName, hashString } from "./file-identity"

export interface IndexingLookupCache {
  artistIdsByName: Map<string, string>
  albumIdsByArtistAndTitle: Map<string, string>
  genreIdsByName: Map<string, string>
  genreVisuals: GenreVisualLookup
}

export interface GenreVisualLookup {
  supportsVisualColumns: boolean
  usedCombinations: Set<string>
  colorUsage: Map<string, number>
  shapeUsage: Map<GenreShape, number>
}

export function createEmptyGenreVisualLookup(): GenreVisualLookup {
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

export function registerGenreVisual(
  visualLookup: GenreVisualLookup,
  color: string,
  shape: GenreShape
) {
  visualLookup.usedCombinations.add(`${color}::${shape}`)
  visualLookup.colorUsage.set(color, (visualLookup.colorUsage.get(color) ?? 0) + 1)
  visualLookup.shapeUsage.set(shape, (visualLookup.shapeUsage.get(shape) ?? 0) + 1)
}

export function getAlbumLookupKey(artistId: string, title: string) {
  return `${artistId}::${title}`
}

export async function preloadIndexingLookupCache(): Promise<IndexingLookupCache> {
  const [artistRows, albumRows] = await Promise.all([
    db.query.artists.findMany({
      columns: {
        id: true,
        name: true,
      },
    }),
    db.query.albums.findMany({
      columns: {
        id: true,
        title: true,
        artistId: true,
      },
    }),
  ])

  const genreVisuals = createEmptyGenreVisualLookup()
  const genreIdsByName = new Map<string, string>()

  try {
    const genreRows = await db.query.genres.findMany({
      columns: {
        id: true,
        name: true,
        color: true,
        shape: true,
      },
    })

    for (const genre of genreRows) {
      genreIdsByName.set(genre.name, genre.id)
      registerGenreVisual(genreVisuals, genre.color, genre.shape as GenreShape)
    }
  } catch {
    genreVisuals.supportsVisualColumns = false

    const genreRows = await db.query.genres.findMany({
      columns: {
        id: true,
        name: true,
      },
    })

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
  const existing = await db.query.artists.findFirst({
    where: eq(artists.name, name),
  })

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

  const existing = await db.query.genres.findFirst({
    where: eq(genres.name, name),
  })

  if (existing) {
    lookupCache?.genreIdsByName.set(name, existing.id)
    return existing.id
  }

  const id = generateId()
  const { color, shape } = selectGenreVisuals(name, lookupCache)
  try {
    await db.insert(genres).values({
      id,
      name,
      color,
      shape,
      createdAt: Date.now(),
    })
  } catch {
    await db.insert(genres).values({
      id,
      name,
      createdAt: Date.now(),
    })
  }

  lookupCache?.genreIdsByName.set(name, id)
  if (lookupCache?.genreVisuals.supportsVisualColumns) {
    registerGenreVisual(lookupCache.genreVisuals, color, shape)
  }

  return id
}

export function selectGenreVisuals(
  name: string,
  lookupCache?: IndexingLookupCache
): { color: string; shape: GenreShape } {
  if (!lookupCache?.genreVisuals.supportsVisualColumns) {
    const hash = hashString(name)
    return {
      color: GENRE_COLORS[hash % GENRE_COLORS.length],
      shape: GENRE_SHAPES[Math.floor(hash / GENRE_COLORS.length) % GENRE_SHAPES.length],
    }
  }

  const { colorUsage, shapeUsage, usedCombinations } = lookupCache.genreVisuals

  const colorsByUsage = [...GENRE_COLORS].sort(
    (a, b) => (colorUsage.get(a) ?? 0) - (colorUsage.get(b) ?? 0)
  )
  const shapesByUsage = [...GENRE_SHAPES].sort(
    (a, b) => (shapeUsage.get(a) ?? 0) - (shapeUsage.get(b) ?? 0)
  )

  for (const color of colorsByUsage) {
    for (const shape of shapesByUsage) {
      const key = `${color}::${shape}`
      if (!usedCombinations.has(key)) {
        return { color, shape }
      }
    }
  }

  const hash = hashString(name)
  const color = GENRE_COLORS[hash % GENRE_COLORS.length]
  const shape = GENRE_SHAPES[Math.floor(hash / GENRE_COLORS.length) % GENRE_SHAPES.length]

  return { color, shape }
}
