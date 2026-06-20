/**
 * Purpose: Defines stable React Query keys and invalidation groups for library, album-artist, search, and recent-search data.
 * Caller: Library query hooks, mutations, and cache update flows.
 * Dependencies: TanStack Query client and shared query invalidation helper.
 * Main Functions: libraryKeys, invalidateLibraryQueries()
 * Side Effects: Invalidates cached React Query data.
 */

import type { QueryClient } from "@tanstack/react-query"
import { invalidateQueryKeys } from "@/lib/query-invalidation"

export const ARTISTS_KEY = "artists"
export const ALBUMS_KEY = "albums"
export const SEARCH_KEY = "search"
export const RECENT_SEARCHES_KEY = "recent-searches"

export const libraryKeys = {
  artists: (orderByField: "name" | "trackCount" | "dateAdded", order: "asc" | "desc") =>
    [ARTISTS_KEY, orderByField, order] as const,
  artist: (artistId: string) => [ARTISTS_KEY, artistId] as const,
  albums: (
    orderByField: "title" | "artist" | "year" | "trackCount" | "dateAdded",
    order: "asc" | "desc"
  ) => [ALBUMS_KEY, orderByField, order] as const,
  album: (albumId: string) => [ALBUMS_KEY, albumId] as const,
  tracksByAlbumName: (albumName: string) => ["tracks", "album-name", albumName] as const,
  tracksByArtistName: (artistName: string) => ["tracks", "artist-name", artistName] as const,
  search: (query: string) => [SEARCH_KEY, query] as const,
  recentSearches: () => [RECENT_SEARCHES_KEY] as const,
}

export async function invalidateLibraryQueries(queryClient: QueryClient) {
  await invalidateQueryKeys(queryClient, [[ARTISTS_KEY], [ALBUMS_KEY], [SEARCH_KEY]])
}
