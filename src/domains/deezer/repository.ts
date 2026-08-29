import { AsyncRateLimiter } from "@tanstack/pacer/async-rate-limiter"
import { and, eq, gt, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm"

import { db } from "@/core/db"
import { albums, artists, tracks } from "@/core/db/schema"
import { logError, logInfo } from "@/core/log/service"
import { saveArtworkToCache } from "@/domains/indexer/metadata/artwork-cache"
import { isNumber, isRecord, isString } from "@/lib/guards"
import { selectArtistCandidate } from "./artist-match"

const DEEZER_API_URL = "https://api.deezer.com"

const DEEZER_DEFAULT_AVATAR_HASHES = [
  "e23066163f21176a822b54001ee648a2", // Deezer current default placeholder silhouette
  "270b9a0569709219d84e115ceba415f9", // Deezer legacy default placeholder silhouette
  "d41d8cd98f00b204e9800998ecf8427e", // Empty string MD5
]

export function isDeezerDefaultAvatar(url: string | null | undefined): boolean {
  if (!url) return true
  if (
    url.includes("/artist//") ||
    url.includes("/artist/default") ||
    url.includes("default_artist")
  ) {
    return true
  }
  for (const hash of DEEZER_DEFAULT_AVATAR_HASHES) {
    if (url.includes(hash)) return true
  }
  return false
}

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

  // Filter out candidates that only have the Deezer default placeholder avatar
  const nonDefaultCandidates = candidates.filter((c) => !isDeezerDefaultAvatar(c.picture_xl))
  const candidatePool = nonDefaultCandidates.length > 0 ? nonDefaultCandidates : candidates

  const chosen = selectArtistCandidate(candidatePool, artistName)
  if (!chosen) return null

  let pictureUrl = chosen.picture_xl
  if (!pictureUrl) {
    const detailRes = await fetch(`${DEEZER_API_URL}/artist/${chosen.id}`)
    if (detailRes.ok) {
      const detail = await detailRes.json()
      pictureUrl = isRecord(detail) && isString(detail.picture_xl) ? detail.picture_xl : undefined
    }
  }

  if (isDeezerDefaultAvatar(pictureUrl)) {
    return null
  }

  return pictureUrl ?? null
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

const ARTIST_REFRESH_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export interface DeezerArtistCandidate {
  id: number
  name: string
  picture_xl: string
  nb_fan?: number
  nb_album?: number
}

export async function searchDeezerArtistCandidates(
  artistName: string
): Promise<DeezerArtistCandidate[]> {
  const searchUrl = `${DEEZER_API_URL}/search/artist?q=${encodeURIComponent(artistName)}&limit=25`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) {
    return []
  }

  const searchData = await searchRes.json()
  if (!isRecord(searchData) || !Array.isArray(searchData.data)) {
    return []
  }

  const candidates: DeezerArtistCandidate[] = []
  for (const entry of searchData.data) {
    if (isRecord(entry) && isNumber(entry.id) && isString(entry.name)) {
      const picture =
        (isString(entry.picture_xl) && entry.picture_xl) ||
        (isString(entry.picture_big) && entry.picture_big) ||
        (isString(entry.picture_medium) && entry.picture_medium) ||
        ""

      if (picture && !isDeezerDefaultAvatar(picture)) {
        candidates.push({
          id: entry.id,
          name: entry.name,
          picture_xl: picture,
          nb_fan: isNumber(entry.nb_fan) ? entry.nb_fan : undefined,
          nb_album: isNumber(entry.nb_album) ? entry.nb_album : undefined,
        })
      }
    }
  }

  return candidates
}

export async function fetchDeezerArtistImageById(deezerId: number): Promise<string | null> {
  try {
    const detailRes = await fetch(`${DEEZER_API_URL}/artist/${deezerId}`)
    if (!detailRes.ok) return null
    const detail = await detailRes.json()
    if (!isRecord(detail)) return null
    const picture =
      (isString(detail.picture_xl) && detail.picture_xl) ||
      (isString(detail.picture_big) && detail.picture_big) ||
      (isString(detail.picture_medium) && detail.picture_medium) ||
      null

    if (picture && !isDeezerDefaultAvatar(picture)) {
      return picture
    }
    return null
  } catch {
    return null
  }
}

export async function setArtistDeezerArtwork(
  artistId: string,
  deezerArtistId: number,
  pictureUrl: string
): Promise<string | undefined> {
  const localPath = await saveArtworkToCache(pictureUrl)
  const cachedPath = localPath ?? pictureUrl

  await db
    .update(artists)
    .set({
      artwork: cachedPath,
      deezerId: deezerArtistId,
      updatedAt: Date.now(),
    })
    .where(eq(artists.id, artistId))

  return cachedPath
}

export const DEEZER_ID_DISABLED = -1

export async function resolveArtistFallbackArtwork(artistId: string): Promise<string | null> {
  const primaryTrack = await db.query.tracks.findFirst({
    where: and(eq(tracks.artistId, artistId), eq(tracks.isDeleted, 0), isNotNull(tracks.artwork)),
    columns: { artwork: true },
    orderBy: (t, { desc }) => [desc(t.lastPlayedAt), desc(t.dateAdded)],
  })
  if (primaryTrack?.artwork) {
    return primaryTrack.artwork
  }

  const albumWithArt = await db.query.albums.findFirst({
    where: and(eq(albums.artistId, artistId), isNotNull(albums.artwork)),
    columns: { artwork: true },
  })
  if (albumWithArt?.artwork) {
    return albumWithArt.artwork
  }

  return null
}

export async function removeArtistArtwork(artistId: string): Promise<string | null> {
  const fallbackArtwork = await resolveArtistFallbackArtwork(artistId)

  await db
    .update(artists)
    .set({
      artwork: fallbackArtwork,
      deezerId: DEEZER_ID_DISABLED,
      updatedAt: Date.now(),
    })
    .where(eq(artists.id, artistId))

  return fallbackArtwork
}

export async function refreshDeezerArtistImages(forceRefresh = false, signal?: AbortSignal) {
  const runStartedAt = Date.now()
  const cooldownThreshold = runStartedAt - ARTIST_REFRESH_COOLDOWN_MS

  const whereClause = forceRefresh
    ? and(
        gt(artists.trackCount, 0),
        or(isNull(artists.deezerId), ne(artists.deezerId, DEEZER_ID_DISABLED))
      )
    : and(
        gt(artists.trackCount, 0),
        or(isNull(artists.deezerId), ne(artists.deezerId, DEEZER_ID_DISABLED)),
        or(
          eq(artists.updatedAt, 0),
          isNull(artists.updatedAt),
          lt(artists.updatedAt, cooldownThreshold)
        )
      )

  const rows = await db.query.artists.findMany({
    where: whereClause,
    columns: {
      id: true,
      name: true,
      artwork: true,
      deezerId: true,
    },
    orderBy: sql`lower(coalesce(${artists.name}, ''))`,
  })

  let fetchedCount = 0
  let missCount = 0
  let failureCount = 0

  const rateLimiter = new AsyncRateLimiter(async (name: string) => fetchDeezerArtistImage(name), {
    limit: 50,
    window: 5000,
    windowType: "sliding",
  })

  for (const artist of rows) {
    if (signal?.aborted) {
      logInfo("Deezer artist image refresh aborted", {
        forceRefresh,
        targets: rows.length,
        processed: fetchedCount + missCount + failureCount,
      })
      return
    }

    let image: string | null | undefined
    try {
      if (artist.deezerId) {
        image = await fetchDeezerArtistImageById(artist.deezerId)
      } else {
        image = await rateLimitedFetch(rateLimiter, artist.name, signal)
      }
    } catch (err) {
      failureCount += 1
      logError(
        "refreshDeezerArtistImages: skipped artist",
        err instanceof Error ? err : new Error(String(err)),
        { artistId: artist.id, artistName: artist.name }
      )
      continue
    }

    if (image === null) {
      missCount += 1
    } else if (image !== undefined) {
      fetchedCount += 1
    } else {
      failureCount += 1
    }

    // Always bump updatedAt so missing or found artists are not re-queried within the cooldown window
    let cachedImage: string | null = image ?? null
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
      let finalArtwork = cachedImage
      if (!finalArtwork) {
        // If Deezer returned no image or default placeholder, check if existing artwork is a stale default
        if (isDeezerDefaultAvatar(artist.artwork)) {
          finalArtwork = await resolveArtistFallbackArtwork(artist.id)
        } else {
          finalArtwork = artist.artwork
        }
      }

      await db
        .update(artists)
        .set({
          artwork: finalArtwork,
          updatedAt: Date.now(),
        })
        .where(eq(artists.id, artist.id))
    }
  }

  logInfo("Deezer artist image refresh completed", {
    forceRefresh,
    targets: rows.length,
    fetched: fetchedCount,
    missed: missCount,
    failed: failureCount,
    durationMs: Date.now() - runStartedAt,
  })
}
