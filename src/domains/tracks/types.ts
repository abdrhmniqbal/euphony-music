export interface CommonTrack {
  id: string
  name: string
  artwork: string | null
  artists: string[] | null
  albumName: string | null
  uri: string
  duration: number
}

export interface DataTrack extends CommonTrack {
  artistName: string | null
  discoverTime: number | null
  modificationTime: number | null
  rawArtistName?: string | null
  albumId?: string | null
  parentFolder?: string | null
  isFavorite?: boolean
}
