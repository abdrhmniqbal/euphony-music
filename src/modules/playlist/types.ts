export interface PlaylistPickerSelection {
  id: string
  name: string
  hasTrack: boolean
}

export type Playlist = {
  id: string
  name: string
  artwork: string | null
  isFavorite: boolean
  trackCount: number
}
