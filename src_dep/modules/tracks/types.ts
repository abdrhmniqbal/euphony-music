import type { CommonTrack } from "@/modules/library/data-types"

export interface TrackFilter {
  artistId?: string
  albumId?: string
  genreId?: string
  isFavorite?: boolean
  searchQuery?: string
  sortBy?: "title" | "artist" | "album" | "dateAdded" | "playCount" | "rating"
  sortOrder?: "asc" | "desc"
}

export type Track = CommonTrack & {
  artistName: string | null
  discoverTime: number | null
  modificationTime: number | null
  rawArtistName?: string | null
  albumId?: string | null
  parentFolder?: string | null
  isFavorite?: boolean
}

export type SortedTrack = Track
export type BulkQueriedTrack = Track
