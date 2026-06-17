import { asc, eq, sql, inArray } from "drizzle-orm"

import { db } from "@/db/client"
import { artists, trackArtists, tracks } from "@/db/schema"
import type { Artist } from "./types"

function toArtist(row: typeof artists.$inferSelect): Artist {
  return {
    id: row.id,
    name: row.name,
    artwork: row.artwork ?? null,
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
    albumCount: row.albumCount ?? 0,
  }
}

export async function getArtist(id: string) {
  const row = await db.query.artists.findFirst({ where: eq(artists.id, id) })
  if (!row) throw new Error("err.msg.noArtists")
  return toArtist(row)
}

export async function getArtistsSummary() {
  const rows = await db.query.artists.findMany({ orderBy: asc(sql`lower(coalesce(${artists.name}, ''))`) })
  return rows.map(toArtist)
}

export async function getSortedArtistTracks<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const rels = await db
    .select({ trackId: trackArtists.trackId })
    .from(trackArtists)
    .innerJoin(artists, eq(trackArtists.artistId, artists.id))
    .where(eq(artists.name, id))

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
