import { asc, eq, sql, like, and } from "drizzle-orm"

import { db } from "@/db/client"
import { tracks } from "@/db/schema"

export async function getFoldersSummary() {
  const rows = await db
    .select({ uri: tracks.uri, count: sql<number>`count(*)` })
    .from(tracks)
    .groupBy(sql`rtrim(${tracks.uri}, replace(${tracks.uri}, '/', ''))`)
    .orderBy(asc(tracks.uri))

  return rows.map((row) => ({
    path: row.uri.split("/").slice(0, -1).join("/"),
    trackCount: row.count,
  }))
}

export async function getSortedFolderTracks<TOnlyIds extends boolean | undefined = false>(
  path: string | null | undefined,
  onlyIds?: TOnlyIds
) {
  if (!path) return [] as TOnlyIds extends true ? Array<{ id: string }> : never[]

  const prefix = `file:///${path}/`
  const rows = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), like(tracks.uri, `${prefix}%`)),
    orderBy: asc(tracks.uri),
  })

  if (onlyIds) {
    return rows.map((r) => ({ id: r.id })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : never[]
  }

  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}
