/**
 * Purpose: Reads and mutates listening history, top-track metrics, and playback activity counters.
 * Caller: history queries, history mutations, player activity service, advanced settings maintenance actions.
 * Dependencies: Drizzle database client, play_history table, tracks table, track transformers.
 * Main Functions: getTrackHistory(), getTopTracksByPeriod(), addTrackToHistory(), incrementTrackPlayCount(), resetListeningHistory()
 * Side Effects: Reads play history; writes play_history rows; updates track play counts and last-played timestamps.
 */

import { createId } from "@paralleldrive/cuid2"
import type { Track } from "@/modules/player/types"

import { desc, eq, sql } from "drizzle-orm"

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
    if (period === "all") {
      const topTracks = await db.query.tracks.findMany({
        where: eq(tracks.isDeleted, 0),
        orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
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
        limit,
      })

      return topTracks
        .filter((track) => track.playCount && track.playCount > 0)
        .map((track) => transformDBTrackToTrack(track as DBTrack))
    }

    let timeThreshold: number
    if (period === "day") {
      timeThreshold = getStartOfLocalDay()
    } else if (period === "week") {
      timeThreshold = getStartOfLocalWeek()
    } else {
      timeThreshold = getStartOfLocalMonth()
    }


    const history = await db.query.playHistory.findMany({
      where: sql`${playHistory.playedAt} >= ${timeThreshold}`,
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

export async function addTrackToHistory(trackId: string): Promise<void> {
  try {
    await db.insert(playHistory).values({
      id: createId(),
      trackId,
      playedAt: Date.now(),
      duration: 0,
      completed: 0,
    })

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    const cutoffThreshold = Date.now() - THIRTY_DAYS_MS

    await db.run(sql`
      DELETE FROM ${playHistory}
      WHERE ${playHistory.playedAt} < ${cutoffThreshold}
    `)
  } catch {
    // no-op
  }
}

export async function incrementTrackPlayCount(trackId: string): Promise<void> {
  try {
    await db
      .update(tracks)
      .set({
        playCount: sql`${tracks.playCount} + 1`,
        lastPlayedAt: Date.now(),
      })
      .where(eq(tracks.id, trackId))
  } catch {
    // no-op
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

export async function addPlayedTrack(trackUri: string) {
  const row = await db.query.tracks.findFirst({ where: eq(tracks.uri, trackUri) })
  if (!row) return undefined
  const now = Date.now()
  await db
    .update(tracks)
    .set({ playCount: (row.playCount ?? 0) + 1, lastPlayedAt: now })
    .where(eq(tracks.id, row.id))
  await db.insert(playHistory).values({ id: createId(), trackId: row.id, playedAt: now })
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
