import { AsyncRateLimiter } from "@tanstack/pacer/async-rate-limiter"
import { and, gt, isNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { artists } from "@/db/schema"
import { logError } from "@/modules/logging/service"
import { saveArtworkToCache } from "@/modules/indexer/metadata/metadata"

const DEEZER_API_URL = "https://api.deezer.com"

function normalizeArtistName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
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

  const searchData = (await searchRes.json()) as {
    data?: Array<{ id: number; name: string; picture_xl?: string; nb_fan?: number }>
  }
  const candidates = (searchData.data ?? [])
    .filter(
      (c): c is { id: number; name: string; picture_xl?: string; nb_fan?: number } =>
        !!c && typeof c.id === "number" && typeof c.name === "string"
    )
    .sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))

  if (candidates.length === 0) return null

  const normalized = normalizeArtistName(artistName)
  const matched = candidates.find((c) => normalizeArtistName(c.name) === normalized)
  const chosen = matched ?? candidates[0]
  if (!chosen) return null

  if (chosen.picture_xl) return chosen.picture_xl

  const detailRes = await fetch(`${DEEZER_API_URL}/artist/${chosen.id}`)
  if (!detailRes.ok) return null
  const detail = (await detailRes.json()) as { picture_xl?: string }
  return detail.picture_xl ?? null
}

export async function fetchDeezerArtistImage(artistName: string): Promise<string | null> {
  try {
    return (await resolveArtistImage(artistName)) ?? null
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
        or(isNull(artists.artwork), sql`artists.artwork NOT LIKE 'http%'`),
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

  const rateLimiter = new AsyncRateLimiter(
    async (name: string) => fetchDeezerArtistImage(name),
    {
      limit: 50,
      window: 5000,
      windowType: "sliding",
    }
  )

  for (const artist of rows) {
    if (signal?.aborted) return
    if (!forceRefresh && artist.artwork?.startsWith("http")) continue

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
    if (!image) continue

    let cachedImage = image
    if (cachedImage.startsWith("http://") || cachedImage.startsWith("https://")) {
      try {
        const localPath = await saveArtworkToCache(cachedImage)
        if (localPath) cachedImage = localPath
      } catch (err) {
        logError("Failed to cache artist image", err instanceof Error ? err : new Error(String(err)))
      }
    }

    await db
      .update(artists)
      .set({
        artwork: cachedImage || (artist.artwork?.startsWith("http") ? null : artist.artwork) || null,
        updatedAt: Date.now(),
      })
      .where(sql`${artists.id} = ${artist.id}`)
  }
}
