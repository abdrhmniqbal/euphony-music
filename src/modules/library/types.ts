/**
 * Purpose: Declares library search and recent-search result shapes.
 * Caller: Library repository, search UI, and recent-search persistence.
 * Dependencies: Player track model.
 * Main Functions: SearchArtistResult, SearchAlbumResult, SearchPlaylistResult, SearchResults, RecentSearchEntry, AddRecentSearchInput.
 * Side Effects: None.
 */

import type { Track } from "@/modules/player/types"

export interface SearchArtistResult {
  id: string
  name: string
  type: string
  followerCount: number
  trackCount: number
  image?: string
}

export interface SearchAlbumResult {
  id: string
  title: string
  artist: string
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

export interface RecentSearchEntry {
  id: string
  query: string
  title: string
  subtitle: string
  type?: "track" | "album" | "artist" | "playlist"
  targetId?: string
  image?: string
  images?: string[]
  createdAt: number
}

export interface AddRecentSearchInput {
  query: string
  title?: string
  subtitle?: string
  type?: "track" | "album" | "artist" | "playlist"
  targetId?: string
  image?: string
  images?: string[]
}
