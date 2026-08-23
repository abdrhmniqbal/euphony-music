import type { PlayerTrack } from "@/playback/types"

export interface SearchArtistResult {
  id: string
  name: string
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
  tracks: PlayerTrack[]
  artists: SearchArtistResult[]
  albums: SearchAlbumResult[]
  playlists: SearchPlaylistResult[]
}

export type RecentSearchType = "track" | "album" | "artist" | "playlist"

export interface RecentSearchEntry {
  id: string
  query: string
  title: string
  subtitle: string
  type?: RecentSearchType
  targetId?: string
  image?: string
  images?: string[]
  createdAt: number
}
