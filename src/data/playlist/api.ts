import { asc, eq, sql, inArray } from "drizzle-orm"

import { db } from "@/db/client"
import { playlists, playlistTracks, tracks } from "@/db/schema"
import type { Playlist } from "./types"

function toPlaylist(row: typeof playlists.$inferSelect): Playlist {
  return {
    id: row.id,
    name: row.name,
    artwork: row.artwork ?? null,
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
  }
}

export async function getPlaylist(id: string) {
  const row = await db.query.playlists.findFirst({ where: eq(playlists.id, id) })
  if (!row) throw new Error("err.msg.noPlaylists")
  return toPlaylist(row)
}

export async function getPlaylistsSummary() {
  const rows = await db.query.playlists.findMany({
    orderBy: asc(sql`lower(coalesce(${playlists.name}, ''))`),
  })
  return rows.map(toPlaylist)
}

export async function getPlaylistTracks<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds
) {
  const rels = await db
    .select({ trackId: playlistTracks.trackId })
    .from(playlistTracks)
    .innerJoin(playlists, eq(playlistTracks.playlistId, playlists.id))
    .where(eq(playlists.name, id))
    .orderBy(asc(playlistTracks.position))

  const trackIds = rels.map((r) => r.trackId)
  if (trackIds.length === 0) return [] as TOnlyIds extends true ? Array<{ id: string }> : never[]

  if (onlyIds) {
    return trackIds.map((tid) => ({ id: tid })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : never[]
  }

  const rows = await db.query.tracks.findMany({
    where: inArray(tracks.id, trackIds),
    with: { artist: true, album: { with: { artist: true } } },
  })
  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}
