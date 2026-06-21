import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/lib/tanstack-query"
import * as SecureStore from "expo-secure-store"

export interface LastFmArtistInfo {
  bio?: string
  image?: string
}

export async function fetchLastFmArtistInfo(artistName: string): Promise<LastFmArtistInfo> {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_API_KEY || (await SecureStore.getItemAsync("lastfm.apiKey"))

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
      const mega = images.find((img) => img.size === "mega")
      const extralarge = images.find((img) => img.size === "extralarge")
      const large = images.find((img) => img.size === "large")
      imageUrl = mega?.["#text"] || extralarge?.["#text"] || large?.["#text"]
    }
    
    return {
      bio: bioText,
      image: imageUrl || undefined,
    }
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
