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
