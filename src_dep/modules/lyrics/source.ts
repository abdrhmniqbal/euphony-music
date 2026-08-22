/**
 * Purpose: Resolves lyrics from nearby sidecar files or embedded track metadata with in-memory caching.
 * Caller: Player lyrics view.
 * Dependencies: drizzle-orm, TextDecoder.
 * Main Functions: fetchAndPersistLyrics(), loadLyricsFromDatabase()
 * Side Effects: Reads sidecar lyric files from device storage.
 */

import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { tracks } from "@/db/schema"
import { logWarn } from "@/modules/logging/service"
import type { Track } from "@/modules/player/types"

export async function fetchAndPersistLyrics(track: Track): Promise<string | null> {
  try {
    const artist = track.artist || ""
    const title = track.title
    const album = track.album || ""
    const duration = track.duration ? Math.round(track.duration) : 0

    const url = new URL("https://lrclib.net/api/get")
    url.searchParams.append("artist_name", artist)
    url.searchParams.append("track_name", title)
    if (album) {
      url.searchParams.append("album_name", album)
    }
    if (duration) {
      url.searchParams.append("duration", String(duration))
    }

    const response = await fetch(url.toString())
    if (response.status === 200) {
      const data = await response.json()
      const fetchedLyrics = data.syncedLyrics || data.plainLyrics || ""

      await db.update(tracks).set({ lyrics: fetchedLyrics }).where(eq(tracks.id, track.id))

      return fetchedLyrics
    } else if (response.status === 404) {
      await db.update(tracks).set({ lyrics: "" }).where(eq(tracks.id, track.id))
    }
  } catch (error) {
    logWarn("Failed to fetch lyrics from LRCLIB", {
      error,
      trackId: track.id,
    })
  }

  return null
}

export async function loadLyricsFromDatabase(trackId: string): Promise<string | null> {
  try {
    const dbTrack = await db.query.tracks.findFirst({
      where: eq(tracks.id, trackId),
      columns: { lyrics: true },
    })

    return dbTrack?.lyrics ?? null
  } catch (error) {
    logWarn("Failed to hydrate lyrics from database fallback", {
      error,
      trackId,
    })
    return null
  }
}
