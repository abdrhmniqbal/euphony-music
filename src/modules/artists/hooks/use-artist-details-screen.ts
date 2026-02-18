import { useState } from "react"
import { useStore } from "@nanostores/react"
import { useLocalSearchParams, useRouter } from "expo-router"

import { useIsFavorite } from "@/modules/favorites/favorites.queries"
import {
  $sortConfig,
  ALBUM_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
  setSortConfig,
  sortAlbums,
  sortTracks,
  type SortField,
} from "@/modules/library/library-sort.store"
import { useTracksByArtistName } from "@/modules/library/library.queries"
import { $tracks, playTrack, type Track } from "@/modules/player/player.store"
import type { Album } from "@/components/blocks/album-grid"

import { buildArtistAlbums } from "../artists.utils"

function getSafeRouteName(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function useArtistDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const router = useRouter()

  const allSortConfigs = useStore($sortConfig)
  const allTracks = useStore($tracks)
  const artistName = getSafeRouteName(name)
  const normalizedArtistName = artistName.trim().toLowerCase()

  const { data: artistTracksFromQuery = [] } = useTracksByArtistName(artistName)
  const artistTracks =
    artistTracksFromQuery.length > 0
      ? artistTracksFromQuery
      : allTracks.filter(
          (track) =>
            (track.artist || track.albumArtist || "").trim().toLowerCase() ===
            normalizedArtistName
        )
  const artistId = artistTracks[0]?.artistId
  const artistImage = artistTracks.find((track) => track.image)?.image
  const { data: isArtistFavorite = false } = useIsFavorite(
    "artist",
    artistId || ""
  )

  const albums = buildArtistAlbums(artistTracks)
  const sortedArtistTracks = sortTracks(
    artistTracks,
    allSortConfigs.ArtistTracks
  )
  const popularTracks = sortedArtistTracks.slice(0, 5)

  const sortedAlbums = sortAlbums(
    albums.map((album) => ({ ...album, id: album.title }) as Album),
    allSortConfigs.ArtistAlbums
  )

  const [activeView, setActiveView] = useState<
    "overview" | "tracks" | "albums"
  >("overview")
  const [navDirection, setNavDirection] = useState<"forward" | "back">(
    "forward"
  )
  const [sortModalVisible, setSortModalVisible] = useState(false)

  const currentTab =
    activeView === "tracks"
      ? "ArtistTracks"
      : activeView === "albums"
        ? "ArtistAlbums"
        : "ArtistTracks"
  const sortConfig = allSortConfigs[currentTab]

  function navigateTo(view: "overview" | "tracks" | "albums") {
    if (view === "overview") {
      setNavDirection("back")
    } else {
      setNavDirection("forward")
    }

    setActiveView(view)
  }

  function playArtistTrack(track: Track) {
    playTrack(track, sortedArtistTracks)
  }

  function playAllTracks() {
    if (artistTracks.length > 0) {
      playTrack(artistTracks[0], sortedArtistTracks)
    }
  }

  function shuffleTracks() {
    if (artistTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * artistTracks.length)
      playTrack(artistTracks[randomIndex], sortedArtistTracks)
    }
  }

  function openAlbum(album: Album) {
    router.push(`../album/${encodeURIComponent(album.title)}`)
  }

  function selectSort(field: SortField, order?: "asc" | "desc") {
    setSortConfig(currentTab, field, order)
  }

  function getSortLabel() {
    const options =
      activeView === "tracks" ? TRACK_SORT_OPTIONS : ALBUM_SORT_OPTIONS
    return (
      options.find((option) => option.field === sortConfig.field)?.label ||
      "Sort"
    )
  }

  return {
    name: artistName,
    artistTracks,
    artistId,
    artistImage,
    isArtistFavorite,
    albums,
    sortedArtistTracks,
    popularTracks,
    sortedAlbums,
    activeView,
    navDirection,
    sortModalVisible,
    setSortModalVisible,
    sortConfig,
    navigateTo,
    playArtistTrack,
    playAllTracks,
    shuffleTracks,
    openAlbum,
    selectSort,
    getSortLabel,
  }
}
