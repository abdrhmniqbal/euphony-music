export type Album = {
  id: string
  name: string
  artwork: string | null
  artists: string[]
  isFavorite: boolean
  trackCount: number
}
