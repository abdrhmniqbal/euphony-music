import { asc, desc, sql } from "drizzle-orm"
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

function fromJsonArrayString(value: string | null): string[] | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : null
  } catch {
    return null
  }
}

function commonTracksOrIds<TTrack extends CommonTrack, TOnlyIds extends boolean | undefined>(
  results: Array<TOnlyIds extends true ? { id: string } : TTrack>,
  onlyIds?: TOnlyIds
) {
  return results as TOnlyIds extends true ? Array<{ id: string }> : TTrack[]
}

function iAsc(value: Parameters<typeof asc>[0]) {
  return asc(sql`lower(${value})`)
}

function iDesc(value: Parameters<typeof desc>[0]) {
  return desc(sql`lower(${value})`)
}
