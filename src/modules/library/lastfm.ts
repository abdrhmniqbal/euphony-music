import { AsyncRateLimiter } from "@tanstack/pacer/async-rate-limiter"
import * as SecureStore from "expo-secure-store"
import { and, gt, isNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { artists } from "@/db/schema"
import { logError } from "@/modules/logging/service"
import { saveArtworkToCache } from "@/modules/indexer/metadata/artwork-cache-repository"

export interface LastFmArtistInfo {
  bio?: string
  image?: string
}

function extractMetaImage(html: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    const image = match?.[1]?.replace(/&amp;/g, "&").trim()
    if (image) {
      return image
    }
  }

  return undefined
}

async function fetchLastFmPageImage(artistName: string, artistUrl?: string) {
  const url = artistUrl || `https://www.last.fm/music/${encodeURIComponent(artistName)}`
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    if (!response.ok) {
      logError("fetchLastFmPageImage: HTTP error", undefined, { url, status: response.status })
      return undefined
    }

    const html = await response.text()
    const image = extractMetaImage(html)
    if (!image) {
      logError("fetchLastFmPageImage: no image found in meta", undefined, { url })
    }
    return image
  } catch (err) {
    logError(
      "fetchLastFmPageImage: failed to fetch or parse",
      err instanceof Error ? err : new Error(String(err)),
      { url }
    )
    return undefined
  }
}

async function fetchLastFmArtistInfo(artistName: string): Promise<LastFmArtistInfo> {
  const storedKey = await SecureStore.getItemAsync("lastfm.apiKey")
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_API_KEY?.trim() || storedKey?.trim()

  if (!apiKey) {
    return {
      image: await fetchLastFmPageImage(artistName),
    }
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
      artistName
    )}&api_key=${apiKey}&autocorrect=1&format=json`
    const response = await fetch(url)
    if (!response.ok) {
      const errText = await response.text().catch(() => "")
      logError("fetchLastFmArtistInfo: API response not ok", undefined, {
        status: response.status,
        body: errText,
      })
      return {
        image: await fetchLastFmPageImage(artistName),
      }
    }

    const data = await response.json()
    const artist = data?.artist
    if (!artist) {
      logError("fetchLastFmArtistInfo: no artist in JSON response", undefined, { data })
      return {
        image: await fetchLastFmPageImage(artistName),
      }
    }

    // Extract bio
    const bioSummary = artist.bio?.summary
    const bioText = bioSummary ? bioSummary.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "").trim() : undefined

    let artistUrl = artist.url
    const images = artist.image
    let imageUrl: string | undefined
    if (Array.isArray(images) && images.length > 0) {
      const candidates = ["mega", "extralarge", "large", "medium", "small"]
      for (const size of candidates) {
        const match = images.find(
          (img) =>
            img.size === size &&
            typeof img?.["#text"] === "string" &&
            img["#text"].trim().length > 0
        )
        if (match?.["#text"]) {
          imageUrl = match["#text"]
          break
        }
      }
    }

    if (
      !imageUrl &&
      typeof artist?.image?.["#text"] === "string" &&
      artist.image["#text"].trim().length > 0
    ) {
      imageUrl = artist.image["#text"]
    }

    if (!imageUrl && typeof artist?.image === "string" && artist.image.trim().length > 0) {
      imageUrl = artist.image
    }

    // Last.fm's API frequently returns empty star placeholder images inside the image array.
    // e.g. "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"
    // If we only get a placeholder or no API image, rely on the page scraper.
    if (imageUrl && imageUrl.includes("2a96cbd8b46e442fc41c2b86b821562f")) {
      imageUrl = undefined
    }

    if (!imageUrl) {
      imageUrl = await fetchLastFmPageImage(artistName, artistUrl)
    }

    // Do not use Last.fm default/no-image fallback assets if the scraper failed too.
    // e.g. "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png" or typical grey stars.
    if (
      imageUrl &&
      (imageUrl.includes("2a96cbd8b46e442fc41c2b86b821562f") ||
        imageUrl.includes("noimage") ||
        imageUrl.includes("default_artist"))
    ) {
      imageUrl = undefined
    }

    return {
      bio: bioText,
      image: imageUrl || undefined,
    }
  } catch (err) {
    logError(
      "fetchLastFmArtistInfo: general failure",
      err instanceof Error ? err : new Error(String(err)),
      { artistName }
    )
    return {
      image: await fetchLastFmPageImage(artistName),
    }
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
  // Capture the run start so we can use artists.updatedAt as a resume cursor:
  // artists already refreshed this run (or by a prior completed run) are skipped,
  // so an interrupted run restarts without re-fetching already-done artists.
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
