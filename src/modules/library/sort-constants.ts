import type {
  AlbumSortField,
  AlbumTrackSortField,
  ArtistSortField,
  FavoriteSortField,
  FolderSortField,
  PlaylistSortField,
  SortConfig,
  TabName,
  TrackSortField,
} from "@/modules/library/sort-types"

export const DEFAULT_SORT_CONFIG: Record<TabName, SortConfig> = {
  Tracks: { field: "title", order: "asc" },
  Albums: { field: "title", order: "asc" },
  Artists: { field: "name", order: "asc" },
  Genres: { field: "name", order: "asc" },
  Playlists: { field: "name", order: "asc" },
  Folders: { field: "name", order: "asc" },
  Favorites: { field: "dateAdded", order: "desc" },
  ArtistTracks: { field: "playCount", order: "desc" },
  ArtistAlbums: { field: "year", order: "desc" },
  AlbumTracks: { field: "trackNumber", order: "asc" },
}

export const TRACK_SORT_OPTIONS: { label: string; field: TrackSortField }[] = [
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.album", field: "album" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.playCount", field: "playCount" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.filename", field: "filename" },
]

export const ALBUM_TRACK_SORT_OPTIONS: {
  label: string
  field: AlbumTrackSortField
}[] = [
  { label: "library.sortOption.trackNumber", field: "trackNumber" },
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.playCount", field: "playCount" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.filename", field: "filename" },
]

export const ALBUM_SORT_OPTIONS: { label: string; field: AlbumSortField }[] = [
  { label: "library.sortOption.title", field: "title" },
  { label: "library.sortOption.artist", field: "artist" },
  { label: "library.sortOption.year", field: "year" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.numberOfTracks", field: "trackCount" },
]

export const ARTIST_SORT_OPTIONS: { label: string; field: ArtistSortField }[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.numberOfTracks", field: "trackCount" },
]

export const PLAYLIST_SORT_OPTIONS: {
  label: string
  field: PlaylistSortField
}[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.numberOfTracks", field: "trackCount" },
]

export const FOLDER_SORT_OPTIONS: { label: string; field: FolderSortField }[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.dateAdded", field: "dateAdded" },
  { label: "library.sortOption.numberOfFiles", field: "trackCount" },
]

export const FAVORITE_SORT_OPTIONS: {
  label: string
  field: FavoriteSortField
}[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.type", field: "type" },
  { label: "library.sortOption.addedToFavorites", field: "dateAdded" },
]

export const GENRE_SORT_OPTIONS: { label: string; field: ArtistSortField }[] = [
  { label: "library.sortOption.name", field: "name" },
  { label: "library.sortOption.numberOfTracks", field: "trackCount" },
]
