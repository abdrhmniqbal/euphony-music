import { AsyncRateLimiter } from "@tanstack/pacer/async-rate-limiter"
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm"

import { db } from "@/core/db"
import { artists } from "@/core/db/schema"
import { logError } from "@/core/log/service"
import { saveArtworkToCache } from "@/domains/indexer/metadata/artwork-cache"
import { isNumber, isRecord, isString } from "@/lib/guards"
import { selectArtistCandidate } from "./artist-match"

const DEEZER_API_URL = "https://api.deezer.com"

interface DeezerArtistMatch {
  id: number
  name: string
  picture_xl?: string
  nb_fan?: number
}

async function resolveArtistImage(artistName: string): Promise<string | null> {
  const searchUrl = `${DEEZER_API_URL}/search/artist?q=${encodeURIComponent(artistName)}&limit=10`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) {
    logError("resolveDeezerArtistImage: search not ok", undefined, {
      status: searchRes.status,
      artistName,
    })
    return null
  }

  const searchData = await searchRes.json()
  if (!isRecord(searchData) || !Array.isArray(searchData.data)) {
    return null
  }

  const candidates = searchData.data
    .filter(
      (entry): entry is DeezerArtistMatch =>
        isRecord(entry) && isNumber(entry.id) && isString(entry.name)
    )
    .sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))

  if (candidates.length === 0) return null

  const chosen = selectArtistCandidate(candidates, artistName)
  if (!chosen) return null

  if (chosen.picture_xl) return chosen.picture_xl

  const detailRes = await fetch(`${DEEZER_API_URL}/artist/${chosen.id}`)
  if (!detailRes.ok) return null
  const detail = await detailRes.json()
  return isRecord(detail) && isString(detail.picture_xl) ? detail.picture_xl : null
}

const deezerCache = new Map<string, string | null>()

export async function fetchDeezerArtistImage(artistName: string): Promise<string | null> {
  const normalizedName = artistName.trim().toLowerCase()
  if (deezerCache.has(normalizedName)) {
    return deezerCache.get(normalizedName)!
  }

  try {
    const result = (await resolveArtistImage(artistName)) ?? null
    deezerCache.set(normalizedName, result)
    return result
  } catch (err) {
    logError(
      "fetchDeezerArtistImage: general failure",
      err instanceof Error ? err : new Error(String(err)),
      { artistName }
    )
    return null
  }
}

async function rateLimitedFetch(
  rateLimiter: AsyncRateLimiter<(...args: string[]) => Promise<string | null>>,
  artistName: string,
  signal?: AbortSignal
): Promise<string | null | undefined> {
  while (!signal?.aborted) {
    try {
      const result = await rateLimiter.maybeExecute(artistName)
      if (result !== undefined) return result
    } catch (err) {
      logError(
        "rateLimitedFetch: request failed",
        err instanceof Error ? err : new Error(String(err)),
        { artistName }
      )
      return undefined
    }

    const waitMs = rateLimiter.getMsUntilNextWindow()
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 200)))
    }
  }
  return undefined
}

export async function refreshDeezerArtistImages(forceRefresh = false, signal?: AbortSignal) {
  const runStartedAt = Date.now()

  const whereClause = forceRefresh
    ? gt(artists.trackCount, 0)
    : and(
        gt(artists.trackCount, 0),
        or(isNull(artists.artwork), eq(artists.artwork, "")),
        lt(artists.updatedAt, runStartedAt)
      )

  const rows = await db.query.artists.findMany({
    where: whereClause,
    columns: {
      id: true,
      name: true,
      artwork: true,
    },
    orderBy: sql`lower(coalesce(${artists.name}, ''))`,
  })

  const rateLimiter = new AsyncRateLimiter(async (name: string) => fetchDeezerArtistImage(name), {
    limit: 50,
    window: 5000,
    windowType: "sliding",
  })

  for (const artist of rows) {
    if (signal?.aborted) return
    if (!forceRefresh && artist.artwork) continue

    let image: string | null | undefined
    try {
      image = await rateLimitedFetch(rateLimiter, artist.name, signal)
    } catch (err) {
      logError(
        "refreshDeezerArtistImages: skipped artist",
        err instanceof Error ? err : new Error(String(err)),
        { artistId: artist.id, artistName: artist.name }
      )
      continue
    }

    // Always bump updatedAt so missing artists are not re-queried within the same session.
    let cachedImage = image || null
    if (cachedImage && (cachedImage.startsWith("http://") || cachedImage.startsWith("https://"))) {
      try {
        const localPath = await saveArtworkToCache(cachedImage)
        if (localPath) cachedImage = localPath
      } catch (err) {
        logError(
          "Failed to cache artist image",
          err instanceof Error ? err : new Error(String(err))
        )
      }
    }

    if (image !== undefined) {
      await db
        .update(artists)
        .set({
          artwork: cachedImage,
          updatedAt: Date.now(),
        })
        .where(eq(artists.id, artist.id))
    }
  }
}
