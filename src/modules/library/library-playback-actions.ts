import type { FavoriteEntry } from "@/modules/favorites/types"
import { sortTracks } from "@/modules/library/sort-utils"
import { playTrack } from "@/modules/player/service"
import type { Track } from "@/modules/player/types"
import { buildFavoritesPlaybackQueue } from "./favorite-playback-queue"

export function playSingleTrack({
  track,
  tracks,
  queue,
  activeTabTitle,
  tracksSortConfig,
  defaultTracksTitle,
}: {
  track: Track
  tracks: Track[]
  queue?: Track[]
  activeTabTitle: string
  tracksSortConfig: any
  defaultTracksTitle: string
}) {
  if (queue && queue.length > 0) {
    playTrack(track, queue, {
      type: "trackList",
      title: activeTabTitle,
    })
    return
  }

  const sortedTracksQueue = sortTracks(tracks, tracksSortConfig)
  if (sortedTracksQueue.length > 0) {
    playTrack(track, sortedTracksQueue, {
      type: "trackList",
      title: defaultTracksTitle,
    })
    return
  }

  playTrack(track)
}

export async function playFavoriteTrack({
  trackId,
  filteredFavorites,
  tracks,
  favoritesTitle,
}: {
  trackId: string
  filteredFavorites: FavoriteEntry[]
  tracks: Track[]
  favoritesTitle: string
}) {
  const queue = await buildFavoritesPlaybackQueue(filteredFavorites, tracks)
  const track = queue.find((item) => item.id === trackId)
  if (track) {
    playTrack(track, queue, {
      type: "favorites",
      title: favoritesTitle,
    })
    return
  }

  const fallbackTrack = tracks.find((item) => item.id === trackId)
  if (fallbackTrack) {
    playTrack(fallbackTrack, queue.length > 0 ? queue : tracks, {
      type: "favorites",
      title: favoritesTitle,
    })
  }
}

export async function playAllTracks({
  activeTab,
  tracks,
  tracksSortConfig,
  filteredFavorites,
  defaultTracksTitle,
  favoritesTitle,
}: {
  activeTab: string
  tracks: Track[]
  tracksSortConfig: any
  filteredFavorites: FavoriteEntry[]
  defaultTracksTitle: string
  favoritesTitle: string
}) {
  if (activeTab === "Tracks") {
    const sortedTracksQueue = sortTracks(tracks, tracksSortConfig)
    if (sortedTracksQueue.length > 0) {
      playTrack(sortedTracksQueue[0], sortedTracksQueue, {
        type: "trackList",
        title: defaultTracksTitle,
      })
    }
    return
  }

  if (activeTab === "Favorites") {
    const queue = await buildFavoritesPlaybackQueue(filteredFavorites, tracks)
    if (queue.length > 0) {
      playTrack(queue[0], queue, {
        type: "favorites",
        title: favoritesTitle,
      })
    }
    return
  }

  if (tracks.length > 0) {
    playTrack(tracks[0])
  }
}

export async function shuffleTracks({
  activeTab,
  tracks,
  tracksSortConfig,
  filteredFavorites,
  defaultTracksTitle,
  favoritesTitle,
}: {
  activeTab: string
  tracks: Track[]
  tracksSortConfig: any
  filteredFavorites: FavoriteEntry[]
  defaultTracksTitle: string
  favoritesTitle: string
}) {
  if (activeTab === "Tracks") {
    const sortedTracksQueue = sortTracks(tracks, tracksSortConfig)
    if (sortedTracksQueue.length > 0) {
      const randomIndex = Math.floor(Math.random() * sortedTracksQueue.length)
      playTrack(sortedTracksQueue[randomIndex], sortedTracksQueue, {
        type: "trackList",
        title: defaultTracksTitle,
      })
    }
    return
  }

  if (activeTab === "Favorites") {
    const queue = await buildFavoritesPlaybackQueue(filteredFavorites, tracks)
    if (queue.length > 0) {
      const randomIndex = Math.floor(Math.random() * queue.length)
      playTrack(queue[randomIndex], queue, {
        type: "favorites",
        title: favoritesTitle,
      })
    }
    return
  }

  if (tracks.length > 0) {
    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex])
  }
}
