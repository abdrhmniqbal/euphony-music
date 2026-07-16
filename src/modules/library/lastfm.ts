import { AsyncRateLimiter } from "@tanstack/pacer/async-rate-limiter"
import { and, gt, isNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { artists } from "@/db/schema"
import { logError } from "@/modules/logging/service"
import { saveArtworkToCache } from "@/modules/indexer/metadata/metadata"
import { LASTFM_SERVICE_URL } from "@/modules/settings/lastfm-integration"

export interface LastFmArtistInfo {
  bio?: string
  image?: string
}

async function fetchLastFmArtistInfo(artistName: string): Promise<LastFmArtistInfo> {
  const url = `${LASTFM_SERVICE_URL}/api/artist?name=${encodeURIComponent(artistName)}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      logError("fetchLastFmArtistInfo: service response not ok", undefined, {
        status: response.status,
        url,
      })
      return {}
    }
    const data = (await response.json()) as { bio?: string | null; image?: string | null }
    return {
      bio: data.bio ?? undefined,
      image: data.image ?? undefined,
    }
  } catch (err) {
    logError(
      "fetchLastFmArtistInfo: general failure",
      err instanceof Error ? err : new Error(String(err)),
      { artistName }
    )
    return {}
  }
}

async function rateLimitedFetch(
  rateLimiter: AsyncRateLimiter<(...args: string[]) => Promise<LastFmArtistInfo>>,
  artistName: string,
  signal?: AbortSignal
): Promise<LastFmArtistInfo | undefined> {
  while (!signal?.aborted) {
    try {
      const result = await rateLimiter.maybeExecute(artistName)
      if (result !== undefined) return result
    } catch (err) {
      logError("rateLimitedFetch: request failed", err instanceof Error ? err : new Error(String(err)), {
        artistName,
      })
      return undefined
    }

    const waitMs = rateLimiter.getMsUntilNextWindow()
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 200)))
    }
  }
  return undefined
}

export async function refreshLastFmArtistMetadataForIndexedArtists(
  forceRefresh = false,
  signal?: AbortSignal
) {
  const runStartedAt = Date.now()

  const whereClause = forceRefresh
    ? gt(artists.trackCount, 0)
    : and(
        gt(artists.trackCount, 0),
        or(
          isNull(artists.artwork),
          sql`artists.artwork NOT LIKE 'http%'`,
          isNull(artists.bio)
        ),
        lt(artists.updatedAt, runStartedAt)
      )

  const rows = await db.query.artists.findMany({
    where: whereClause,
    columns: {
      id: true,
      name: true,
      artwork: true,
      bio: true,
    },
    orderBy: sql`lower(coalesce(${artists.name}, ''))`,
  })

  const rateLimiter = new AsyncRateLimiter(
    async (name: string) => fetchLastFmArtistInfo(name),
    {
      limit: 2,
      window: 1000,
      windowType: "sliding",
    }
  )

  for (const artist of rows) {
    if (signal?.aborted) return
    if (!forceRefresh && artist.artwork?.startsWith("http") && artist.bio) continue

    let info: LastFmArtistInfo | undefined
    try {
      info = await rateLimitedFetch(rateLimiter, artist.name, signal)
    } catch (err) {
      logError(
        "refreshLastFmArtistMetadata: skipped artist",
        err instanceof Error ? err : new Error(String(err)),
        { artistId: artist.id, artistName: artist.name }
      )
      continue
    }
    if (!info?.bio && !info?.image) continue

    let cachedImage = info.image
    if (cachedImage && (cachedImage.startsWith("http://") || cachedImage.startsWith("https://"))) {
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
        bio: info.bio || artist.bio || null,
        artwork: cachedImage || (artist.artwork?.startsWith("http") ? null : artist.artwork) || null,
        updatedAt: Date.now(),
      })
      .where(sql`${artists.id} = ${artist.id}`)
  }
}
