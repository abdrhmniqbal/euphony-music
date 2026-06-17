import { asc, desc, sql } from "drizzle-orm"

import type { CommonTrack } from "./types"

export function fromJsonArrayString(value: string | null): string[] | null {
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

export function commonTracksOrIds<TTrack extends CommonTrack, TOnlyIds extends boolean | undefined>(
  results: Array<TOnlyIds extends true ? { id: string } : TTrack>,
  onlyIds?: TOnlyIds
) {
  return results as TOnlyIds extends true ? Array<{ id: string }> : TTrack[]
}

export function iAsc(value: Parameters<typeof asc>[0]) {
  return asc(sql`lower(${value})`)
}

export function iDesc(value: Parameters<typeof desc>[0]) {
  return desc(sql`lower(${value})`)
}
