import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/lib/tanstack-query"
import * as SecureStore from "expo-secure-store"
import { File, Paths } from "expo-file-system"

export interface LastFmArtistInfo {
  bio?: string
  image?: string
}

const CACHE_FILE = new File(Paths.cache, "lastfm-artist-cache.json")

interface CacheMap {
  [artistName: string]: {
    data: LastFmArtistInfo
    timestamp: number
  }
}

async function loadCacheMap(): Promise<CacheMap> {
  try {
    if (!CACHE_FILE.exists) return {}
    const text = await CACHE_FILE.text()
    return JSON.parse(text) as CacheMap
  } catch {
    return {}
  }
}

async function saveCacheMap(map: CacheMap) {
  try {
    if (!CACHE_FILE.exists) {
      CACHE_FILE.create({ intermediates: true })
    }
    await CACHE_FILE.write(JSON.stringify(map), { encoding: "utf8" })
  } catch {
    // Ignore cache write errors
  }
}

export async function fetchLastFmArtistInfo(artistName: string): Promise<LastFmArtistInfo> {
  const normalizedName = artistName.trim().toLowerCase()
  const cache = await loadCacheMap()
  
  // 7 days cache validity for artists
  const now = Date.now()
  const cached = cache[normalizedName]
  if (cached && now - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
    return cached.data
  }

  const storedKey = await SecureStore.getItemAsync("lastfm.apiKey")
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_API_KEY || storedKey

  if (!apiKey) {
    return {}
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
    
    // Extract image. Last.fm provides an array of images. We want the mega or large one.
    const images = artist.image
    let imageUrl: string | undefined
    if (Array.isArray(images) && images.length > 0) {
      const candidates = ["mega", "extralarge", "large", "medium", "small"]
      for (const size of candidates) {
        const match = images.find((img) => img.size === size && typeof img?.["#text"] === "string" && img["#text"].trim().length > 0)
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
    
    const result = {
      bio: bioText,
      image: imageUrl || undefined,
    }
    
    cache[normalizedName] = { data: result, timestamp: now }
    await saveCacheMap(cache)
    
    return result
  } catch {
    return {}
  }
}

export function useLastFmArtistInfo(artistName: string) {
  return useQuery(
    {
      queryKey: ["lastfm", "artist", artistName.trim().toLowerCase()],
      queryFn: async () => await fetchLastFmArtistInfo(artistName),
      enabled: artistName.trim().length > 0,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    },
    queryClient
  )
}
