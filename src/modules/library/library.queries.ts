import { useDebouncedValue } from "@tanstack/react-pacer/debouncer"
import { useQuery } from "@tanstack/react-query"
import { and, asc, desc, eq, like } from "drizzle-orm"

import { db } from "@/db/client"
import { albums, artists, genres, tracks } from "@/db/schema"

const ARTISTS_KEY = "artists"
const ALBUMS_KEY = "albums"

export function useArtists(
  orderByField: "name" | "trackCount" | "dateAdded" = "name",
  order: "asc" | "desc" = "asc"
) {
  return useQuery({
    queryKey: [ARTISTS_KEY, orderByField, order],
    queryFn: async () => {
      const results = await db.query.artists.findMany({
        with: {
          tracks: {
            where: eq(tracks.isDeleted, 0),
            columns: { id: true },
          },
          albums: {
            columns: { artwork: true },
            limit: 1,
          },
        },
      })

      const mapped = results.map((artist) => ({
        id: artist.id,
        name: artist.name,
        sortName: artist.sortName,
        artwork: artist.artwork,
        createdAt: artist.createdAt,
        albumArtwork: artist.albums[0]?.artwork || null,
        trackCount: artist.tracks.length,
      }))

      const multiplier = order === "asc" ? 1 : -1
      return mapped.sort((a, b) => {
        let aVal: string | number
        let bVal: string | number
        switch (orderByField) {
          case "trackCount":
            aVal = a.trackCount
            bVal = b.trackCount
            break
          case "dateAdded":
            aVal = a.createdAt
            bVal = b.createdAt
            break
          case "name":
          default:
            aVal = (a.sortName || a.name).toLowerCase()
            bVal = (b.sortName || b.name).toLowerCase()
        }
        if (aVal < bVal) return -1 * multiplier
        if (aVal > bVal) return 1 * multiplier
        return 0
      })
    },
  })
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: [ARTISTS_KEY, id],
    queryFn: async () => {
      return db.query.artists.findFirst({
        where: eq(artists.id, id),
        with: {
          albums: {
            orderBy: [desc(albums.year)],
          },
          tracks: {
            where: eq(tracks.isDeleted, 0),
            with: {
              album: true,
            },
          },
        },
      })
    },
  })
}

export function useAlbums(
  orderByField: "title" | "artist" | "year" | "trackCount" = "title",
  order: "asc" | "desc" = "asc"
) {
  return useQuery({
    queryKey: [ALBUMS_KEY, orderByField, order],
    queryFn: async () => {
      const results = await db.query.albums.findMany({
        with: {
          artist: true,
          tracks: {
            where: eq(tracks.isDeleted, 0),
            columns: { id: true },
          },
        },
      })

      const mapped = results.map((album) => ({
        id: album.id,
        title: album.title,
        artistId: album.artistId,
        year: album.year,
        artwork: album.artwork,
        createdAt: album.createdAt,
        artist: album.artist,
        trackCount: album.tracks.length,
      }))

      const multiplier = order === "asc" ? 1 : -1
      return mapped.sort((a, b) => {
        let aVal: string | number | null
        let bVal: string | number | null
        switch (orderByField) {
          case "year":
            aVal = a.year || 0
            bVal = b.year || 0
            break
          case "trackCount":
            aVal = a.trackCount
            bVal = b.trackCount
            break
          case "artist":
            aVal = (a.artist?.sortName || a.artist?.name || "").toLowerCase()
            bVal = (b.artist?.sortName || b.artist?.name || "").toLowerCase()
            break
          case "title":
          default:
            aVal = a.title.toLowerCase()
            bVal = b.title.toLowerCase()
        }
        if (aVal < bVal) return -1 * multiplier
        if (aVal > bVal) return 1 * multiplier
        return 0
      })
    },
  })
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: [ALBUMS_KEY, id],
    queryFn: async () => {
      return db.query.albums.findFirst({
        where: eq(albums.id, id),
        with: {
          artist: true,
          tracks: {
            where: eq(tracks.isDeleted, 0),
            orderBy: [
              asc(tracks.discNumber),
              asc(tracks.trackNumber),
              asc(tracks.title),
            ],
            with: {
              artist: true,
            },
          },
        },
      })
    },
  })
}

export function useSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 300,
  })

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { tracks: [], artists: [], albums: [], genres: [] }
      }

      const searchTerm = `%${debouncedQuery}%`

      const [trackResults, artistResults, albumResults, genreResults] =
        await Promise.all([
          db.query.tracks.findMany({
            where: and(like(tracks.title, searchTerm), eq(tracks.isDeleted, 0)),
            with: { artist: true, album: true },
            limit: 20,
          }),
          db.query.artists.findMany({
            where: like(artists.name, searchTerm),
            limit: 10,
          }),
          db.query.albums.findMany({
            where: like(albums.title, searchTerm),
            with: { artist: true },
            limit: 10,
          }),
          db.query.genres.findMany({
            where: like(genres.name, searchTerm),
            limit: 10,
          }),
        ])

      return {
        tracks: trackResults,
        artists: artistResults,
        albums: albumResults,
        genres: genreResults,
      }
    },
    enabled: debouncedQuery.length >= 2,
  })
}

export function useRecentSearches() {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: async () => {
      return [] as string[]
    },
  })
}
