import type { CommonTrack } from "../types"

export type Track = CommonTrack & {
  artistName: string | null
  discoverTime: number | null
  modificationTime: number | null
  rawArtistName?: string | null
  albumId?: string | null
  parentFolder?: string | null
}

export type SortedTrack = Track
export type BulkQueriedTrack = Track
