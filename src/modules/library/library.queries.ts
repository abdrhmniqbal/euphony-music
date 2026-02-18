import { useDebouncedValue } from "@tanstack/react-pacer/debouncer"
import { useQuery } from "@tanstack/react-query"
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm"

import { db } from "@/db/client"
import {
  albums,
  artists,
  playlists,
  playlistTracks,
  tracks,
} from "@/db/schema"
import type { Track } from "@/modules/player/player.types"
import { transformDBTrackToTrack } from "@/utils/transformers"

const ARTISTS_KEY = "artists"
const ALBUMS_KEY = "albums"

interface QueryOptions {
  enabled?: boolean
}

function normalizeLookup(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

export function useArtists(
  orderByField: "name" | "trackCount" | "dateAdded" = "name",
  order: "asc" | "desc" = "asc",
  options: QueryOptions = {}
) {
  return useQuery({
    queryKey: [ARTISTS_KEY, orderByField, order],
    enabled: options.enabled ?? true,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const direction = order === "asc" ? asc : desc
      const orderBy =
        orderByField === "trackCount"
          ? [direction(artists.trackCount), direction(artists.name)]
          : orderByField === "dateAdded"
            ? [direction(artists.createdAt), direction(artists.name)]
            : [direction(artists.sortName), direction(artists.name)]

      const results = await db.query.artists.findMany({
        columns: {
          id: true,
          name: true,
          sortName: true,
          artwork: true,
          createdAt: true,
          trackCount: true,
        },
        with: {
          albums: {
            columns: {
              artwork: true,
            },
            limit: 1,
          },
        },
        orderBy,
      })

      return results.map((artist) => ({
        id: artist.id,
        name: artist.name,
        sortName: artist.sortName,
        artwork: artist.artwork,
        createdAt: artist.createdAt,
        albumArtwork: artist.albums[0]?.artwork || null,
        trackCount: artist.trackCount || 0,
      }))
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
  orderByField: "title" | "artist" | "year" | "trackCount" | "dateAdded" = "title",
  order: "asc" | "desc" = "asc",
  options: QueryOptions = {}
) {
  return useQuery({
    queryKey: [ALBUMS_KEY, orderByField, order],
    enabled: options.enabled ?? true,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const direction = order === "asc" ? asc : desc
      const orderBy =
        orderByField === "year"
          ? [direction(albums.year), direction(albums.title)]
          : orderByField === "trackCount"
            ? [direction(albums.trackCount), direction(albums.title)]
            : orderByField === "dateAdded"
              ? [direction(albums.createdAt), direction(albums.title)]
              : [direction(albums.title)]

      const results = await db.query.albums.findMany({
        columns: {
          id: true,
          title: true,
          artistId: true,
          year: true,
          artwork: true,
          createdAt: true,
          trackCount: true,
        },
        with: {
          artist: true,
        },
        orderBy: orderByField === "artist" ? undefined : orderBy,
      })

      const mapped = results.map((album) => ({
        id: album.id,
        title: album.title,
        artistId: album.artistId,
        year: album.year,
        artwork: album.artwork,
        createdAt: album.createdAt,
        artist: album.artist,
        trackCount: album.trackCount || 0,
      }))

      if (orderByField !== "artist") {
        return mapped
      }

      const multiplier = order === "asc" ? 1 : -1
      return mapped.sort((a, b) => {
        const aVal = (a.artist?.sortName || a.artist?.name || "").toLowerCase()
        const bVal = (b.artist?.sortName || b.artist?.name || "").toLowerCase()
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

export function useTracksByAlbumName(albumName: string) {
  const normalizedAlbumName = normalizeLookup(albumName)

  return useQuery<Track[]>({
    queryKey: ["tracks", "album-name", normalizedAlbumName],
    enabled: normalizedAlbumName.length > 0,
    queryFn: async () => {
      const matchingAlbums = await db.query.albums.findMany({
        columns: {
          id: true,
          title: true,
        },
      })

      const matchingAlbumIds = matchingAlbums
        .filter((album) => normalizeLookup(album.title) === normalizedAlbumName)
        .map((album) => album.id)

      if (matchingAlbumIds.length === 0) {
        const fallbackTracks = await db.query.tracks.findMany({
          where: eq(tracks.isDeleted, 0),
          with: {
            artist: true,
            album: true,
          },
          orderBy: [
            asc(tracks.discNumber),
            asc(tracks.trackNumber),
            asc(tracks.title),
          ],
        })

        return fallbackTracks
          .filter(
            (track) =>
              normalizeLookup(track.album?.title) === normalizedAlbumName
          )
          .map(transformDBTrackToTrack)
      }

      const results = await db.query.tracks.findMany({
        where: and(
          eq(tracks.isDeleted, 0),
          inArray(tracks.albumId, matchingAlbumIds)
        ),
        with: {
          artist: true,
          album: true,
        },
        orderBy: [asc(tracks.discNumber), asc(tracks.trackNumber), asc(tracks.title)],
      })

      return results.map(transformDBTrackToTrack)
    },
  })
}

export function useTracksByArtistName(artistName: string) {
  const normalizedArtistName = normalizeLookup(artistName)

  return useQuery<Track[]>({
    queryKey: ["tracks", "artist-name", normalizedArtistName],
    enabled: normalizedArtistName.length > 0,
    queryFn: async () => {
      const matchingArtists = await db.query.artists.findMany({
        columns: {
          id: true,
          name: true,
        },
      })

      const matchingArtistIds = matchingArtists
        .filter((artist) => normalizeLookup(artist.name) === normalizedArtistName)
        .map((artist) => artist.id)

      if (matchingArtistIds.length === 0) {
        const fallbackTracks = await db.query.tracks.findMany({
          where: eq(tracks.isDeleted, 0),
          with: {
            artist: true,
            album: true,
          },
          orderBy: [asc(tracks.title)],
        })

        return fallbackTracks
          .filter(
            (track) =>
              normalizeLookup(track.artist?.name) === normalizedArtistName
          )
          .map(transformDBTrackToTrack)
      }

      const results = await db.query.tracks.findMany({
        where: and(
          eq(tracks.isDeleted, 0),
          inArray(tracks.artistId, matchingArtistIds)
        ),
        with: {
          artist: true,
          album: true,
        },
      })

      return results.map(transformDBTrackToTrack)
    },
  })
}

export interface SearchArtistResult {
  id: string
  name: string
  type: string
  followerCount: number
  isVerified: boolean
  image?: string
}

export interface SearchAlbumResult {
  id: string
  title: string
  artist: string
  isVerified: boolean
  image?: string
}

export interface SearchPlaylistResult {
  id: string
  title: string
  trackCount: number
  image?: string
  images?: string[]
}

export interface SearchResults {
  tracks: Track[]
  artists: SearchArtistResult[]
  albums: SearchAlbumResult[]
  playlists: SearchPlaylistResult[]
}

export function useSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 220,
  })
  const normalizedQuery = debouncedQuery.trim()

  return useQuery<SearchResults>({
    queryKey: ["search", normalizedQuery],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      if (!normalizedQuery) {
        return {
          tracks: [],
          artists: [],
          albums: [],
          playlists: [],
        }
      }

      const searchTerm = `%${normalizedQuery}%`
      const emptyResults: SearchResults = {
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
      }

      try {
        const [artistResults, albumResults, playlistResults, titleTrackResults] =
          await Promise.all([
            db.query.artists.findMany({
              where: like(artists.name, searchTerm),
              with: {
                albums: {
                  columns: {
                    artwork: true,
                  },
                  limit: 1,
                },
              },
              orderBy: [asc(artists.name)],
              limit: 10,
            }),
            db.query.albums.findMany({
              where: like(albums.title, searchTerm),
              with: { artist: true },
              orderBy: [asc(albums.title)],
              limit: 10,
            }),
            db.query.playlists.findMany({
              where: like(playlists.name, searchTerm),
              orderBy: [desc(playlists.updatedAt)],
              limit: 10,
              with: {
                tracks: {
                  limit: 4,
                  orderBy: [asc(playlistTracks.position)],
                  with: {
                    track: {
                      with: {
                        album: true,
                      },
                    },
                  },
                },
              },
            }),
            db.query.tracks.findMany({
              where: and(eq(tracks.isDeleted, 0), like(tracks.title, searchTerm)),
              with: { artist: true, album: true },
              orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
              limit: 20,
            }),
          ])

        const matchedArtistIds = artistResults.map((artist) => artist.id)
        const matchedAlbumIds = albumResults.map((album) => album.id)

        const relationTrackFilter =
          matchedArtistIds.length > 0 && matchedAlbumIds.length > 0
            ? or(
                inArray(tracks.artistId, matchedArtistIds),
                inArray(tracks.albumId, matchedAlbumIds)
              )
            : matchedArtistIds.length > 0
              ? inArray(tracks.artistId, matchedArtistIds)
              : matchedAlbumIds.length > 0
                ? inArray(tracks.albumId, matchedAlbumIds)
                : null

        const relationTrackResults =
          relationTrackFilter
            ? await db.query.tracks.findMany({
                where: and(eq(tracks.isDeleted, 0), relationTrackFilter),
                with: { artist: true, album: true },
                orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
                limit: 40,
              })
            : []

        const mergedTrackResults = [...titleTrackResults]
        const trackIds = new Set(titleTrackResults.map((track) => track.id))

        for (const track of relationTrackResults) {
          if (trackIds.has(track.id)) {
            continue
          }
          trackIds.add(track.id)
          mergedTrackResults.push(track)
          if (mergedTrackResults.length >= 20) {
            break
          }
        }

        return {
          tracks: mergedTrackResults.map(transformDBTrackToTrack),
          artists: artistResults.map((artist) => ({
            id: artist.id,
            name: artist.name,
            type: "Artist",
            followerCount: 0,
            isVerified: false,
            image: artist.artwork || artist.albums[0]?.artwork || undefined,
          })),
          albums: albumResults.map((album) => ({
            id: album.id,
            title: album.title,
            artist: album.artist?.name || "Unknown Artist",
            isVerified: false,
            image: album.artwork || undefined,
          })),
          playlists: playlistResults.map((playlist) => {
            const images = new Set<string>()
            if (playlist.artwork) {
              images.add(playlist.artwork)
            }

            for (const playlistTrack of playlist.tracks) {
              const image =
                playlistTrack.track?.artwork ||
                playlistTrack.track?.album?.artwork ||
                undefined
              if (image) {
                images.add(image)
              }
              if (images.size >= 4) {
                break
              }
            }

            return {
              id: playlist.id,
              title: playlist.name,
              trackCount: playlist.trackCount || 0,
              image: playlist.artwork || undefined,
              images: Array.from(images),
            }
          }),
        }
      } catch (error) {
        console.error("Search query failed", error)
        return emptyResults
      }
    },
    enabled: normalizedQuery.length > 0,
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
