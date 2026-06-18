/**
 * Purpose: Exposes React Query hooks for local library, artist, album, track, search, and recent-search data.
 * Caller: Library screens, artist and album detail routes, and search surfaces.
 * Dependencies: Local library repository functions and TanStack React Query.
 * Main Functions: useArtists(), useArtist(), useArtistByName(), useAlbums(), useAlbum(), useTracksByAlbumName(), useTracksByArtistName(), useSearch(), useRecentSearches()
 * Side Effects: Triggers cached SQLite reads through React Query.
 */

import type { Track } from "@/modules/player/types"
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer"
import { useQuery } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import { libraryKeys } from "./keys"
import {
  getAlbumById,
  getArtistById,
  getArtistByName,
  getTracksByAlbumName,
  getTracksByArtistName,
  listAlbums,
  listArtists,
  searchLibrary,
} from "./repository"
import { getRecentSearches } from "./recent-searches.repository"
import type { RecentSearchEntry, SearchResults } from "./types"

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
  return useQuery(
    {
      queryKey: libraryKeys.artists(orderByField, order),
      enabled: options.enabled ?? true,
      placeholderData: (previousData) => previousData,
      queryFn: async () => await listArtists(orderByField, order),
    },
    queryClient
  )
}

export function useArtist(id: string) {
  return useQuery(
    {
      queryKey: libraryKeys.artist(id),
      enabled: id.trim().length > 0,
      queryFn: async () => await getArtistById(id),
    },
    queryClient
  )
}

export function useArtistByName(name: string) {
  const normalizedName = normalizeLookup(name)

  return useQuery(
    {
      queryKey: ["artists", "name", normalizedName] as const,
      enabled: normalizedName.length > 0,
      queryFn: async () => await getArtistByName(normalizedName),
    },
    queryClient
  )
}

export function useAlbums(
  orderByField: "title" | "artist" | "year" | "trackCount" | "dateAdded" = "title",
  order: "asc" | "desc" = "asc",
  options: QueryOptions = {}
) {
  return useQuery(
    {
      queryKey: libraryKeys.albums(orderByField, order),
      enabled: options.enabled ?? true,
      placeholderData: (previousData) => previousData,
      queryFn: async () => await listAlbums(orderByField, order),
    },
    queryClient
  )
}

export function useAlbum(id: string) {
  return useQuery(
    {
      queryKey: libraryKeys.album(id),
      queryFn: async () => await getAlbumById(id),
    },
    queryClient
  )
}

export function useTracksByAlbumName(albumName: string) {
  const normalizedAlbumName = normalizeLookup(albumName)

  return useQuery<Track[]>(
    {
      queryKey: libraryKeys.tracksByAlbumName(normalizedAlbumName),
      enabled: normalizedAlbumName.length > 0,
      queryFn: async () => await getTracksByAlbumName(normalizedAlbumName),
    },
    queryClient
  )
}

export function useTracksByArtistName(artistName: string) {
  const normalizedArtistName = normalizeLookup(artistName)

  return useQuery<Track[]>(
    {
      queryKey: libraryKeys.tracksByArtistName(normalizedArtistName),
      enabled: normalizedArtistName.length > 0,
      queryFn: async () => await getTracksByArtistName(normalizedArtistName),
    },
    queryClient
  )
}

export function useSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 220,
  })
  const normalizedQuery = debouncedQuery.trim()

  return useQuery<SearchResults>(
    {
      queryKey: libraryKeys.search(normalizedQuery),
      placeholderData: (previousData) => previousData,
      queryFn: async () => await searchLibrary(normalizedQuery),
      enabled: normalizedQuery.length > 0,
    },
    queryClient
  )
}

export function useRecentSearches() {
  return useQuery<RecentSearchEntry[]>(
    {
      queryKey: libraryKeys.recentSearches(),
      queryFn: getRecentSearches,
    },
    queryClient
  )
}
