import type { SQLWrapper } from "drizzle-orm"

export type DrizzleFilter = Array<SQLWrapper | undefined>

export type CommonTrack = {
  id: string
  name: string
  artwork: string | null
  artists: string[] | null
  albumName: string | null
  uri: string
  duration: number
}

export type TracksSortOptions<TOrder extends string = string> = {
  isAsc: boolean
  order: TOrder
}

export type Album = {
  id: string
  name: string
  artwork: string | null
  artists: string[]
  isFavorite: boolean
  trackCount: number
}

export type Artist = {
  id: string
  name: string
  artwork: string | null
  isFavorite: boolean
  trackCount: number
  albumCount: number
}

