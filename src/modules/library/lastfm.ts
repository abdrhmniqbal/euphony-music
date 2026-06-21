import * as SecureStore from "expo-secure-store"
import { and, gt, isNull, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { artists } from "@/db/schema"

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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    if (!response.ok) return undefined

    return extractMetaImage(await response.text())
  } catch {
    return undefined
  }
}

export async function fetchLastFmArtistInfo(artistName: string): Promise<LastFmArtistInfo> {
  const storedKey = await SecureStore.getItemAsync("lastfm.apiKey")
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_API_KEY || storedKey

  if (!apiKey) {
    return {
      image: await fetchLastFmPageImage(artistName),
    }
  }
  
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
      artistName
    )}&api_key=${apiKey}&format=json`
    const response = await fetch(url)
    if (!response.ok) return {}
    
    const data = await response.json()
    const artist = data?.artist
    if (!artist) return {}
    
    // Extract bio
    const bioSummary = artist.bio?.summary
    const bioText = bioSummary ? bioSummary.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "").trim() : undefined
    
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

    if (!imageUrl && typeof artist?.image?.["#text"] === "string" && artist.image["#text"].trim().length > 0) {
      imageUrl = artist.image["#text"]
    }

    if (!imageUrl && typeof artist?.image === "string" && artist.image.trim().length > 0) {
      imageUrl = artist.image
    }

    if (!imageUrl) {
      imageUrl = await fetchLastFmPageImage(artistName, artist.url)
    }
    
    return {
      bio: bioText,
      image: imageUrl || undefined,
    }
  } catch {
    return {
      image: await fetchLastFmPageImage(artistName),
    }
  }
}

export async function refreshLastFmArtistMetadataForIndexedArtists(
  forceRefresh = false,
  signal?: AbortSignal
) {
  const whereClause = forceRefresh
    ? gt(artists.trackCount, 0)
    : and(gt(artists.trackCount, 0), or(isNull(artists.artwork), isNull(artists.bio)))

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

  for (const artist of rows) {
    if (signal?.aborted) return

    const info = await fetchLastFmArtistInfo(artist.name)
    if (!info.bio && !info.image) continue

    await db
      .update(artists)
      .set({
        bio: info.bio || artist.bio || null,
        artwork: info.image || artist.artwork || null,
        updatedAt: Date.now(),
      })
      .where(sql`${artists.id} = ${artist.id}`)
  }
}
