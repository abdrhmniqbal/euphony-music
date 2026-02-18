import { useStore } from "@nanostores/react"
import { useLocalSearchParams } from "expo-router"

import { useIsFavorite } from "@/modules/favorites/favorites.queries"
import {
  $sortConfig,
  TRACK_SORT_OPTIONS,
  setSortConfig,
  sortTracks,
  type SortField,
} from "@/modules/library/library-sort.store"
import { useTracksByAlbumName } from "@/modules/library/library.queries"
import { $tracks, playTrack, type Track } from "@/modules/player/player.store"

import {
  formatAlbumDuration,
  groupTracksByDisc,
  sortTracksByDiscAndTrack,
} from "../albums.utils"

function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max)
}

function getSafeRouteName(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function useAlbumDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const allSortConfigs = useStore($sortConfig)
  const allTracks = useStore($tracks)

  const albumName = getSafeRouteName(name)
  const normalizedAlbumName = albumName.trim().toLowerCase()
  const { data: albumTracksFromQuery = [] } = useTracksByAlbumName(albumName)
  const albumTracks =
    albumTracksFromQuery.length > 0
      ? albumTracksFromQuery
      : allTracks.filter(
          (track) =>
            (track.album || "").trim().toLowerCase() === normalizedAlbumName
        )

  const albumInfo = (() => {
    if (albumTracks.length === 0) {
      return null
    }

    const firstTrack = albumTracks[0]
    return {
      title: firstTrack.album || "Unknown Album",
      artist: firstTrack.albumArtist || firstTrack.artist || "Unknown Artist",
      image: firstTrack.image,
      year: firstTrack.year,
    }
  })()

  const totalDuration = albumTracks.reduce(
    (sum, track) => sum + (track.duration || 0),
    0
  )
  const sortConfig = allSortConfigs.AlbumTracks || {
    field: "title" as SortField,
    order: "asc" as const,
  }

  const sortedTracks =
    sortConfig.field !== "title" || sortConfig.order !== "asc"
      ? sortTracks(albumTracks, sortConfig)
      : sortTracksByDiscAndTrack(albumTracks)

  const tracksByDisc = groupTracksByDisc(sortedTracks)
  const albumId = albumTracks[0]?.albumId
  const { data: isAlbumFavorite = false } = useIsFavorite("album", albumId || "")

  function playSelectedTrack(track: Track) {
    playTrack(track, sortedTracks)
  }

  function playAllTracks() {
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0], sortedTracks)
    }
  }

  function shuffleTracks() {
    if (sortedTracks.length > 0) {
      const randomIndex = getRandomIndex(sortedTracks.length)
      playTrack(sortedTracks[randomIndex], sortedTracks)
    }
  }

  function selectSort(field: SortField, order?: "asc" | "desc") {
    setSortConfig("AlbumTracks", field, order)
  }

  function getSortLabel() {
    const option = TRACK_SORT_OPTIONS.find(
      (item) => item.field === sortConfig.field
    )
    return option?.label || "Sort"
  }

  return {
    albumInfo,
    albumId,
    isAlbumFavorite,
    tracksByDisc,
    sortedTracks,
    sortConfig,
    totalDurationLabel: formatAlbumDuration(totalDuration),
    playSelectedTrack,
    playAllTracks,
    shuffleTracks,
    selectSort,
    getSortLabel,
  }
}
