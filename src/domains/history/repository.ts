import { desc, gte } from "drizzle-orm"
import { useQuery } from "@tanstack/react-query"

import { db } from "@/core/db"
import { playHistory } from "@/core/db/schema"
import {
  HISTORY_RECENTLY_PLAYED_KEY,
  HISTORY_TOP_TRACKS_KEY,
} from "@/domains/library/query-keys"
import { getPreferenceState } from "@/core/preferences/store"
import { toDataTrack } from "@/domains/tracks/repository"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"

export type HistoryTopTracksPeriod = "all" | "day" | "week" | "month"

type HistoryEntry = Awaited<ReturnType<typeof fetchRecentEntries>>[number]

const historyWith = { track: { with: { artist: true, album: true } } } as const

function entryToPlayerTrack(entry: HistoryEntry): PlayerTrack | null {
  const row = entry.track
  if (!row || row.isDeleted) {
    return null
  }

  return toPlayerTrack(
    toDataTrack({
      id: row.id,
      title: row.title,
      artwork: row.artwork,
      albumId: row.albumId,
      uri: row.uri,
      duration: row.duration,
      dateAdded: row.dateAdded,
      scanTime: row.scanTime,
      rawArtist: row.rawArtist,
      albumName: row.album?.title ?? null,
      artistName: row.artist?.name ?? null,
    }),
    getPreferenceState().splitMultipleValueConfig
  )
}

function getStartOfLocalDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

function getStartOfLocalWeek(now = new Date()) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = startOfDay.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  startOfDay.setDate(startOfDay.getDate() - mondayOffset)
  return startOfDay.getTime()
}

function getStartOfLocalMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

function getPeriodStart(period: Exclude<HistoryTopTracksPeriod, "all">) {
  if (period === "day") {
    return getStartOfLocalDay()
  }
  if (period === "week") {
    return getStartOfLocalWeek()
  }
  return getStartOfLocalMonth()
}

export function dedupeTracksById(list: PlayerTrack[]): PlayerTrack[] {
  const seen = new Set<string>()
  return list.filter((track) => {
    if (seen.has(track.id)) {
      return false
    }

    seen.add(track.id)
    return true
  })
}

function fetchRecentEntries(limit: number) {
  return db.query.playHistory.findMany({
    orderBy: [desc(playHistory.playedAt)],
    limit,
    with: historyWith,
  })
}

export async function getTrackHistory(limit = 50): Promise<PlayerTrack[]> {
  try {
    const entries = await fetchRecentEntries(limit)
    return entries
      .map(entryToPlayerTrack)
      .filter((track): track is PlayerTrack => track !== null)
  } catch (error) {
    console.warn("getTrackHistory failed", error)
    return []
  }
}

export async function getTopTracksByPeriod(
  period: HistoryTopTracksPeriod = "all",
  limit = 25
): Promise<PlayerTrack[]> {
  try {
    const entries = await db.query.playHistory.findMany({
      where:
        period === "all" ? undefined : gte(playHistory.playedAt, getPeriodStart(period)),
      with: historyWith,
    })

    const counts = new Map<string, { count: number; entry: HistoryEntry }>()
    for (const entry of entries) {
      const existing = counts.get(entry.track?.id ?? "")
      if (existing && entry.track) {
        existing.count++
      } else if (entry.track) {
        counts.set(entry.track.id, { count: 1, entry })
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ entry }) => entryToPlayerTrack(entry))
      .filter((track): track is PlayerTrack => track !== null)
  } catch (error) {
    console.warn("getTopTracksByPeriod failed", error)
    return []
  }
}

export function useRecentlyPlayedTracks(limit = 8) {
  return useQuery<PlayerTrack[]>({
    queryKey: [HISTORY_RECENTLY_PLAYED_KEY, limit],
    queryFn: async () => {
      const history = await getTrackHistory()
      return dedupeTracksById(history).slice(0, limit)
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useTopTracksByPeriod(period: HistoryTopTracksPeriod = "all", limit = 25) {
  return useQuery<PlayerTrack[]>({
    queryKey: [HISTORY_TOP_TRACKS_KEY, period, limit],
    queryFn: async () => await getTopTracksByPeriod(period, limit),
    placeholderData: (previousData) => previousData,
  })
}
