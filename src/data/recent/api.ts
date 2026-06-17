import { desc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { playHistory, tracks } from "@/db/schema"

export async function addPlayedTrack(trackUri: string) {
  const row = await db.query.tracks.findFirst({ where: eq(tracks.uri, trackUri) })
  if (!row) return undefined
  const now = Date.now()
  await db.update(tracks).set({ playCount: (row.playCount ?? 0) + 1, lastPlayedAt: now }).where(eq(tracks.id, row.id))
  await db.insert(playHistory).values({ id: `${row.id}-${now}`, trackId: row.id, playedAt: now })
  return row.id
}

export async function addPlayedMediaList(_source: unknown) {
  return undefined
}

export async function removePlayedMediaList(_source: unknown) {
  return undefined
}

export async function updatePlayedMediaList(_params: { oldSource: unknown; newSource: unknown }) {
  return undefined
}

export async function getRecentlyPlayed(limit = 50) {
  return db.query.playHistory.findMany({
    with: { track: true },
    orderBy: desc(playHistory.playedAt),
    limit,
  })
}
