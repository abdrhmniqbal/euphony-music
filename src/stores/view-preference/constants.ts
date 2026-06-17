import type { MutableViewOrder } from "./types"

export const layoutOptions = ["list", "grid", "compactGrid"] as const
export type LayoutOption = (typeof layoutOptions)[number]

type SortOption =
  | "name"
  | "artistName"
  | "albumName"
  | "duration"
  | "trackCount"
  | "discoverTime"
  | "modificationTime"

export const sortOptions = {
  album: ["name", "artistName", "duration", "trackCount"],
  artist: ["name", "duration", "trackCount"],
  artistTracks: ["name", "albumName", "duration"],
  folder: ["name", "artistName", "albumName", "duration", "discoverTime", "modificationTime"],
  genre: ["name", "duration", "trackCount"],
  genreTracks: ["name", "artistName", "albumName", "duration"],
  playlist: ["name", "duration", "trackCount"],
  track: ["name", "artistName", "albumName", "duration", "discoverTime", "modificationTime"],
} as const satisfies Record<MutableViewOrder, SortOption[]>

export type ScreenSortOptions<TScreen extends MutableViewOrder> = (typeof sortOptions)[TScreen][number]

export interface ViewPreferenceStore {
  _hasHydrated: boolean
  _init: (state: ViewPreferenceStore) => Promise<void>
  albumLayout: LayoutOption
  albumIsAsc: boolean
  albumOrder: ScreenSortOptions<"album">
  artistLayout: LayoutOption
  artistIsAsc: boolean
  artistOrder: ScreenSortOptions<"artist">
  artistTracksIsAsc: boolean
  artistTracksOrder: ScreenSortOptions<"artistTracks">
  folderIsAsc: boolean
  folderOrder: ScreenSortOptions<"folder">
  genreLayout: LayoutOption
  genreIsAsc: boolean
  genreOrder: ScreenSortOptions<"genre">
  genreTracksIsAsc: boolean
  genreTracksOrder: ScreenSortOptions<"genreTracks">
  playlistLayout: LayoutOption
  playlistIsAsc: boolean
  playlistOrder: ScreenSortOptions<"playlist">
  trackIsAsc: boolean
  trackOrder: ScreenSortOptions<"track">
}

export const omittedFields: string[] = ["_hasHydrated", "_init"] satisfies Array<keyof ViewPreferenceStore>
