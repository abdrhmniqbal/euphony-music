import { useState } from "react"
import { useStore } from "@nanostores/react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"

import { useAlbums } from "@/modules/albums/albums.queries"
import { useArtists } from "@/modules/artists/artists.queries"
import {
  getFavorites,
  type FavoriteEntry,
} from "@/modules/favorites/favorites.api"
import { useFolderBrowser } from "@/modules/library/hooks/use-folder-browser"
import {
  $sortConfig,
  ALBUM_SORT_OPTIONS,
  ARTIST_SORT_OPTIONS,
  FOLDER_SORT_OPTIONS,
  PLAYLIST_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
  setSortConfig,
  sortGeneric,
  type SortField,
} from "@/modules/library/library-sort.store"
import { getAllTracks } from "@/modules/player/player.api"
import { playTrack, type Track } from "@/modules/player/player.store"
import { usePlaylists } from "@/modules/playlist/playlist.queries"
import type { Playlist } from "@/components/blocks/playlist-list"

export const LIBRARY_TABS = [
  "Tracks",
  "Albums",
  "Artists",
  "Playlists",
  "Folders",
  "Favorites",
] as const
export type LibraryTab = (typeof LIBRARY_TABS)[number]
interface LibrarySortOption {
  label: string
  field: SortField
}

export const LIBRARY_TAB_SORT_OPTIONS: Record<LibraryTab, LibrarySortOption[]> =
  {
    Tracks: TRACK_SORT_OPTIONS,
    Albums: ALBUM_SORT_OPTIONS,
    Artists: ARTIST_SORT_OPTIONS,
    Playlists: PLAYLIST_SORT_OPTIONS,
    Folders: FOLDER_SORT_OPTIONS,
    Favorites: [],
  }

const LIBRARY_FAVORITES_QUERY_KEY = ["library", "favorites"] as const
const LIBRARY_TRACKS_QUERY_KEY = ["library", "tracks"] as const

export function useLibraryScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<LibraryTab>("Tracks")
  const [sortModalVisible, setSortModalVisible] = useState(false)

  const allSortConfigs = useStore($sortConfig)
  const sortConfig = allSortConfigs[activeTab]
  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: LIBRARY_TRACKS_QUERY_KEY,
    queryFn: getAllTracks,
  })

  const { data: favorites = [] } = useQuery<FavoriteEntry[]>({
    queryKey: LIBRARY_FAVORITES_QUERY_KEY,
    queryFn: () => getFavorites(),
  })

  const { data: albumsData } = useAlbums()
  const { data: artistsData } = useArtists()
  const { data: playlistsData } = usePlaylists()

  const playlists: Playlist[] = sortGeneric(
    playlistsData || [],
    allSortConfigs.Playlists
  )

  const {
    folders,
    folderTracks,
    folderBreadcrumbs,
    openFolder,
    goBackFolder,
    navigateToFolderPath,
  } = useFolderBrowser(tracks, allSortConfigs.Folders)

  function closeSortModal() {
    setSortModalVisible(false)
  }

  function openArtist(name: string) {
    router.push(`./artist/${encodeURIComponent(name)}`)
  }

  function openAlbum(title: string) {
    router.push(`./album/${encodeURIComponent(title)}`)
  }

  function openPlaylist(id: string) {
    router.push(`./playlist/${id}`)
  }

  function openPlaylistForm() {
    router.push("/(main)/(library)/playlist/form")
  }

  function playFolderTrack(track: Track) {
    playTrack(track, folderTracks)
  }

  function playSingleTrack(track: Track) {
    playTrack(track)
  }

  function playAll() {
    if (activeTab === "Favorites") {
      const firstTrack = favorites.find((favorite) => favorite.type === "track")
      if (firstTrack) {
        const track = tracks.find((candidate) => candidate.id === firstTrack.id)
        if (track) {
          playTrack(track)
        }
      }
      return
    }

    if (tracks.length > 0) {
      playTrack(tracks[0])
    }
  }

  function shuffle() {
    if (activeTab === "Favorites") {
      const trackFavorites = favorites.filter(
        (favorite) => favorite.type === "track"
      )
      if (trackFavorites.length > 0) {
        const randomIndex = Math.floor(Math.random() * trackFavorites.length)
        const track = tracks.find(
          (candidate) => candidate.id === trackFavorites[randomIndex].id
        )
        if (track) {
          playTrack(track)
        }
      }
      return
    }

    if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length)
      playTrack(tracks[randomIndex])
    }
  }

  function handleSortSelect(field: SortField, order?: "asc" | "desc") {
    setSortConfig(activeTab, field, order)
    if (!order) {
      setSortModalVisible(false)
    }
  }

  function getSortLabel() {
    const options = LIBRARY_TAB_SORT_OPTIONS[activeTab]
    const selected = options.find((option) => option.field === sortConfig.field)
    return selected?.label || "Sort"
  }

  function getItemCount() {
    switch (activeTab) {
      case "Tracks":
        return tracks.length
      case "Albums":
        return albumsData?.length || 0
      case "Artists":
        return artistsData?.length || 0
      case "Favorites":
        return favorites.length
      case "Playlists":
        return playlists.length
      case "Folders":
        return folders.length + folderTracks.length
      default:
        return 0
    }
  }

  return {
    activeTab,
    setActiveTab,
    sortModalVisible,
    setSortModalVisible,
    closeSortModal,
    sortConfig,
    tracks,
    favorites,
    playlists,
    folders,
    folderTracks,
    folderBreadcrumbs,
    openArtist,
    openAlbum,
    openPlaylist,
    openPlaylistForm,
    openFolder,
    goBackFolder,
    navigateToFolderPath,
    playFolderTrack,
    playSingleTrack,
    playAll,
    shuffle,
    handleSortSelect,
    getSortLabel,
    getItemCount,
  }
}
