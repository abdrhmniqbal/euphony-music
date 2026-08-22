/**
 * Purpose: Reads listening history and top-track metrics, and resets playback activity counters.
 * Caller: history queries, history mutations, advanced settings maintenance actions.
 * Dependencies: Drizzle database client, play_history table, tracks table, track transformers.
 * Main Functions: getTrackHistory(), getTopTracksByPeriod(), resetListeningHistory()
 * Side Effects: Reads play history; resets play_history rows and track play counts.
 */

import { desc, sql } from "drizzle-orm"

import type { Track } from "@/modules/player/types"
import { db } from "@/db/client"
import { playHistory, tracks } from "@/db/schema"
import type { DBTrack } from "@/types/database"
import { transformDBTrackToTrack } from "@/utils/transformers"

import type { HistoryTopTracksPeriod } from "./types"

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

export async function getTrackHistory(): Promise<Track[]> {
  try {
    const history = await db.query.playHistory.findMany({
      orderBy: [desc(playHistory.playedAt)],
      with: {
        track: {
          with: {
            artist: true,
            featuredArtists: {
              with: {
                artist: true,
              },
            },
            album: true,
            genres: {
              with: {
                genre: true,
              },
            },
          },
        },
      },
      limit: 50,
    })

    return history
      .filter((item) => item.track && !item.track.isDeleted)
      .map((item) => transformDBTrackToTrack(item.track as DBTrack))
  } catch {
    return []
  }
}

export async function getTopTracksByPeriod(
  period: HistoryTopTracksPeriod = "all",
  limit: number = 25
): Promise<Track[]> {
  try {
    let timeThreshold: number | null
    if (period === "all") {
      timeThreshold = null
    } else if (period === "day") {
      timeThreshold = getStartOfLocalDay()
    } else if (period === "week") {
      timeThreshold = getStartOfLocalWeek()
    } else {
      timeThreshold = getStartOfLocalMonth()
    }

    const history = await db.query.playHistory.findMany({
      where: timeThreshold !== null ? sql`${playHistory.playedAt} >= ${timeThreshold}` : undefined,
      with: {
        track: {
          with: {
            artist: true,
            featuredArtists: {
              with: {
                artist: true,
              },
            },
            album: true,
            genres: {
              with: {
                genre: true,
              },
            },
          },
        },
      },
    })

    const trackCounts = new Map<string, { track: DBTrack; count: number }>()

    for (const entry of history) {
      if (entry.track && !entry.track.isDeleted) {
        const existing = trackCounts.get(entry.trackId)
        if (existing) {
          existing.count++
        } else {
          trackCounts.set(entry.trackId, { track: entry.track, count: 1 })
        }
      }
    }

    return Array.from(trackCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => transformDBTrackToTrack(item.track))
  } catch {
    return []
  }
}

export async function resetListeningHistory(): Promise<void> {
  const now = Date.now()

  await db.transaction(async (tx) => {
    await tx.delete(playHistory)
    await tx.update(tracks).set({
      playCount: 0,
      lastPlayedAt: null,
      updatedAt: now,
    })
  })
}
