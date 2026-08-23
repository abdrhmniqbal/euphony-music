import type { DetailSortField } from "@/domains/tracks/detail-sort"

export interface SortOption {
  label: string
  field: DetailSortField
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

export function resolveSortLabel(
  options: SortOption[],
  field: DetailSortField,
  t: (key: string) => string
): string {
  return options.find((option) => option.field === field)?.label ?? ""
}
