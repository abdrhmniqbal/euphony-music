import type { Track } from "@/modules/player/types"

export interface ArtistAlbum {
  title: string
  artist?: string
  albumArtist?: string
  image?: string
  year?: number
  trackCount: number
}

function selectDominantArtwork(trackArtworks: string[]) {
  if (trackArtworks.length === 0) {
    return undefined
  }

  const stats = new Map<string, { count: number; latestIndex: number }>()

  for (let index = 0; index < trackArtworks.length; index += 1) {
    const artwork = trackArtworks[index]
    const existing = stats.get(artwork)

    if (!existing) {
      stats.set(artwork, { count: 1, latestIndex: index })
      continue
    }

    existing.count += 1
    existing.latestIndex = index
  }

  let selectedArtwork: string | undefined
  let selectedCount = -1
  let selectedLatestIndex = -1

  for (const [artwork, value] of stats.entries()) {
    if (
      value.count > selectedCount ||
      (value.count === selectedCount && value.latestIndex > selectedLatestIndex)
    ) {
      selectedArtwork = artwork
      selectedCount = value.count
      selectedLatestIndex = value.latestIndex
    }
  }

  return selectedArtwork
}

export function buildArtistAlbums(artistTracks: Track[]): ArtistAlbum[] {
  const albumMap = new Map<
    string,
    ArtistAlbum & {
      albumArtworks: string[]
      trackArtworks: string[]
    }
  >()

  artistTracks.forEach((track) => {
    const albumName = track.album || "Unknown Album"
    const existing = albumMap.get(albumName)

    if (existing) {
      existing.trackCount += 1
      if (track.albumArtwork) {
        existing.albumArtworks.push(track.albumArtwork)
      }
      if (track.image) {
        existing.trackArtworks.push(track.image)
      }
      return
    }

    albumMap.set(albumName, {
      title: albumName,
      artist: track.artist,
      albumArtist: track.albumArtist,
      image: undefined,
      year: track.year,
      trackCount: 1,
      albumArtworks: track.albumArtwork ? [track.albumArtwork] : [],
      trackArtworks: track.image ? [track.image] : [],
    })
  })

  return Array.from(albumMap.values()).map((album) => ({
    title: album.title,
    artist: album.artist,
    albumArtist: album.albumArtist,
    image:
      selectDominantArtwork(album.albumArtworks) ||
      selectDominantArtwork(album.trackArtworks),
    year: album.year,
    trackCount: album.trackCount,
  }))
}
