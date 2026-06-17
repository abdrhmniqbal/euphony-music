import { asc, eq, sql, inArray } from "drizzle-orm"

import { db } from "@/db/client"
import { genres, trackGenres, tracks } from "@/db/schema"

export async function getGenre(id: string) {
  const row = await db.query.genres.findFirst({ where: eq(genres.id, id) })
  if (!row) throw new Error("err.msg.noGenres")
  return row
}

export async function getGenresSummary() {
  return db.query.genres.findMany({ orderBy: asc(sql`lower(coalesce(${genres.name}, ''))`) })
}

export async function getSortedGenreTracks<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const rels = await db
    .select({ trackId: trackGenres.trackId })
    .from(trackGenres)
    .innerJoin(genres, eq(trackGenres.genreId, genres.id))
    .where(eq(genres.name, id))

  const trackIds = rels.map((r) => r.trackId)
  if (trackIds.length === 0) return [] as TOnlyIds extends true ? Array<{ id: string }> : never[]

  if (onlyIds) {
    return trackIds.map((tid) => ({ id: tid })) as TOnlyIds extends true ? Array<{ id: string }> : never[]
  }

  const rows = await db.query.tracks.findMany({
    where: inArray(tracks.id, trackIds),
    with: { artist: true, album: { with: { artist: true } } },
  })
  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}
