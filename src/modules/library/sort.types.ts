export type TrackSortField =
  | "title"
  | "artist"
  | "album"
  | "year"
  | "dateAdded"
  | "filename"
  | "playCount"

export type AlbumTrackSortField = TrackSortField | "trackNumber"
export type AlbumSortField =
  | "title"
  | "artist"
  | "year"
  | "dateAdded"
  | "trackCount"
export type ArtistSortField = "name" | "dateAdded" | "trackCount"
export type PlaylistSortField = "name" | "dateAdded" | "trackCount"
export type FolderSortField = "name" | "dateAdded" | "trackCount"
export type FavoriteSortField = "name" | "type" | "dateAdded"

export type SortField =
  | AlbumTrackSortField
  | AlbumSortField
  | ArtistSortField
  | PlaylistSortField
  | FolderSortField
  | FavoriteSortField

export type SortOrder = "asc" | "desc"
export type TabName =
  | "Tracks"
  | "Albums"
  | "Artists"
  | "Genres"
  | "Playlists"
  | "Folders"
  | "Favorites"
  | "ArtistTracks"
  | "ArtistAlbums"
  | "AlbumTracks"

export interface SortConfig {
  field: SortField
  order: SortOrder
}
