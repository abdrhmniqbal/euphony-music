import { asc, eq, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { albums, tracks } from "@/db/schema"
import type { Album } from "./types"

function toAlbum(row: typeof albums.$inferSelect & { artist?: { name: string } | null }): Album {
  return {
    id: row.id,
    name: row.title,
    artwork: row.artwork ?? null,
    artists: row.artist?.name ? [row.artist.name] : [],
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
  }
}

type AlbumDetail = {
  id: string
  name: string
  artwork: string | null
  artists: string[]
  isFavorite: boolean
  trackCount: number
  year: string | null
}

export async function getAlbum(id: string) {
  const row = await db.query.albums.findFirst({ where: eq(albums.id, id), with: { artist: true } })
  if (!row) throw new Error("err.msg.noAlbums")
  return toAlbum(row)
}

export async function getAlbumDetails(id: string): Promise<AlbumDetail> {
  const row = await db.query.albums.findFirst({ where: eq(albums.id, id), with: { artist: true } })
  if (!row) throw new Error("err.msg.noAlbums")
  return { ...toAlbum(row), year: null }
}

export async function getAlbumsSummary() {
  const rows = await db.query.albums.findMany({
    with: { artist: true },
    orderBy: asc(sql`lower(coalesce(${albums.title}, ''))`),
  })
  return rows.map(toAlbum)
}

export async function getAlbumTracks<TOnlyIds extends boolean | undefined = false>(
  albumId: string,
  onlyIds?: TOnlyIds
) {
  const rows = await db.query.tracks.findMany({
    where: eq(tracks.albumId, albumId),
    orderBy: asc(tracks.trackNumber),
  })
  if (onlyIds) {
    return rows.map((r) => ({ id: r.id })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : typeof rows
  }
  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}
