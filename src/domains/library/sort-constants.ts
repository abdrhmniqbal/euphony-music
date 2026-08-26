import type { DetailSortField } from "@/domains/tracks/detail-sort"

export type SortOptionField = DetailSortField | "playlistOrder" | "playlistAddedAt" | "mixOrder"

export interface SortOption {
  label: string
  field: SortOptionField
}

export const ALBUM_TRACK_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.trackNumber", field: "trackNumber" },
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.playCount", field: "playCount" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.filename", field: "filename" },
]

export const MIX_TRACK_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.customOrder", field: "mixOrder" },
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.playCount", field: "playCount" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
]

export const ARTIST_TRACK_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.album", field: "album" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.playCount", field: "playCount" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
]

export const ALBUM_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.numberOfTracks", field: "trackCount" },
]

export const TRACK_TAB_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.album", field: "album" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.playCount", field: "playCount" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.filename", field: "filename" },
]

export const NAME_TRACK_COUNT_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.numberOfTracks", field: "trackCount" },
]

export const FOLDER_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.numberOfFiles", field: "trackCount" },
]

export const FAVORITE_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.type", field: "type" },
  { label: "library.sortOption.addedToFavorites", field: "dateAdded" },
]

export function resolveSortLabel(options: SortOption[], field: SortOptionField): string {
  return options.find((option) => option.field === field)?.label ?? ""
}
