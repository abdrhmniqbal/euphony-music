import { useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import type { FavoriteEntry, FavoriteType } from "@/modules/favorites/types"
import type { GenreCategory } from "@/modules/genres/types"
import type { SortField } from "@/modules/library/sort-types"
import type { Track } from "@/modules/player/store"
import type { Playlist } from "@/components/blocks/playlist-list"
import { useFavorites } from "@/modules/favorites/queries"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { buildFolderBrowserState, getParentFolderPath } from "@/modules/library/folder-browser"
import { setSortConfig, useLibrarySortStore } from "@/modules/library/sort-store"
import { sortGeneric, sortTracks } from "@/modules/library/sort-utils"
import { useAlbums, useArtists } from "@/modules/library/queries"
import { useHasCurrentTrack, usePlayerTracks } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { usePlaylistsWithOptions } from "@/modules/playlist/queries"
import { getPlaylistTrackIdsByPlaylistIds } from "@/modules/playlist/repository"
import { useGenres } from "@/modules/genres/queries"
import { mapGenresToCategories } from "@/modules/genres/utils"
import { getTabBarHeight, MINI_PLAYER_HEIGHT } from "@/constants/layout"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  resolveAlbumTransitionId,
  resolveArtistTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import {
  ALBUM_SORT_OPTIONS,
  ARTIST_SORT_OPTIONS,
  FAVORITE_SORT_OPTIONS,
  FOLDER_SORT_OPTIONS,
  GENRE_SORT_OPTIONS,
  PLAYLIST_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
} from "@/modules/library/sort-constants"

export const LIBRARY_TABS = [
  "Tracks",
  "Albums",
  "Artists",
  "Genres",
  "Playlists",
  "Folders",
  "Favorites",
] as const
export type LibraryTab = (typeof LIBRARY_TABS)[number]

export interface LibrarySortOption {
  label: string
  field: SortField
}

export const LIBRARY_SORT_OPTIONS: Record<LibraryTab, LibrarySortOption[]> = {
  Tracks: TRACK_SORT_OPTIONS,
  Albums: ALBUM_SORT_OPTIONS,
  Artists: ARTIST_SORT_OPTIONS,
  Genres: GENRE_SORT_OPTIONS,
  Playlists: PLAYLIST_SORT_OPTIONS,
  Folders: FOLDER_SORT_OPTIONS,
  Favorites: FAVORITE_SORT_OPTIONS,
}

function getAlbumOrderByField(
  field: SortField
): "title" | "artist" | "year" | "trackCount" | "dateAdded" {
  if (field === "artist") return "artist"
  if (field === "year") return "year"
  if (field === "trackCount") return "trackCount"
  if (field === "dateAdded") return "dateAdded"
  return "title"
}

function getArtistOrderByField(field: SortField): "name" | "trackCount" | "dateAdded" {
  if (field === "trackCount") return "trackCount"
  if (field === "dateAdded") return "dateAdded"
  return "name"
}

export function useLibraryHomeState() {
  const router = useRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const hasMiniPlayer = useHasCurrentTrack()
  const tracks = usePlayerTracks()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const tabBarHeight = getTabBarHeight(insets.bottom)
  const libraryListBottomPadding = tabBarHeight + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0) + 200
  const [activeTab, setActiveTab] = useState<LibraryTab>("Tracks")
  const [favoriteTypeFilters, setFavoriteTypeFilters] = useState<FavoriteType[]>([])
  const [currentFolderPath, setCurrentFolderPath] = useState("")
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const sortConfig = allSortConfigs[activeTab]
  const shouldLoadFavorites = activeTab === "Favorites"
  const shouldLoadAlbums = activeTab === "Albums"
  const shouldLoadArtists = activeTab === "Artists"
  const shouldLoadPlaylists = activeTab === "Playlists"

  const { data: favorites = [] } = useFavorites(undefined, {
    enabled: shouldLoadFavorites,
  })
  const availableFavoriteTypes = useMemo<FavoriteType[]>(
    () => [...new Set(favorites.map((favorite) => favorite.type))],
    [favorites]
  )
  const activeFavoriteTypeFilters = useMemo(
    () => favoriteTypeFilters.filter((type) => availableFavoriteTypes.includes(type)),
    [availableFavoriteTypes, favoriteTypeFilters]
  )
  const handleFavoriteTypeFiltersChange = useCallback(
    (types: FavoriteType[]) => {
      setFavoriteTypeFilters(types.filter((type) => availableFavoriteTypes.includes(type)))
    },
    [availableFavoriteTypes]
  )
  const filteredFavorites = useMemo(() => {
    const visibleFavorites =
      activeFavoriteTypeFilters.length === 0
        ? favorites
        : favorites.filter((favorite) => activeFavoriteTypeFilters.includes(favorite.type))

    return sortGeneric(visibleFavorites, allSortConfigs.Favorites)
  }, [activeFavoriteTypeFilters, allSortConfigs.Favorites, favorites])

  const albumOrderByField = getAlbumOrderByField(allSortConfigs.Albums.field)
  const artistOrderByField = getArtistOrderByField(allSortConfigs.Artists.field)

  const { data: albumsData = [] } = useAlbums(albumOrderByField, allSortConfigs.Albums.order, {
    enabled: shouldLoadAlbums,
  })
  const { data: artistsData = [] } = useArtists(artistOrderByField, allSortConfigs.Artists.order, {
    enabled: shouldLoadArtists,
  })
  const { data: playlistsData = [] } = usePlaylistsWithOptions(shouldLoadPlaylists)
  const { data: genresData = [], refetch: refetchGenres } = useGenres()

  const genres = useMemo<GenreCategory[]>(
    () => mapGenresToCategories(genresData),
    [genresData]
  )

  const sortedGenres = useMemo<GenreCategory[]>(() => {
    const { field, order } = allSortConfigs.Genres

    return [...genres].sort((a, b) => {
      if (field === "trackCount") {
        const leftCount = a.trackCount ?? 0
        const rightCount = b.trackCount ?? 0

        if (leftCount !== rightCount) {
          return order === "asc" ? leftCount - rightCount : rightCount - leftCount
        }

        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        })
      }

      const leftTitle = a.title ?? ""
      const rightTitle = b.title ?? ""

      if (order === "asc") {
        return leftTitle.localeCompare(rightTitle, undefined, {
          sensitivity: "base",
        })
      }

      return rightTitle.localeCompare(leftTitle, undefined, {
        sensitivity: "base",
      })
    })
  }, [allSortConfigs.Genres, genres])

  const playlists = useMemo<Playlist[]>(
    () => sortGeneric(playlistsData, allSortConfigs.Playlists),
    [allSortConfigs.Playlists, playlistsData]
  )

  const {
    folders,
    tracks: folderTracks,
    breadcrumbs: folderBreadcrumbs,
  } = useMemo(
    () => buildFolderBrowserState(tracks, currentFolderPath, allSortConfigs.Folders),
    [allSortConfigs.Folders, currentFolderPath, tracks]
  )

  const showPlayButtons = activeTab === "Tracks" || activeTab === "Favorites"

  const currentSortOptions =
    activeTab === "Genres" ? GENRE_SORT_OPTIONS : LIBRARY_SORT_OPTIONS[activeTab]

  const isRefreshing = isPullRefreshing || isIndexing
  const listResetScrollKey = `${sortConfig.field}-${sortConfig.order}`

  function closeSortModal() {
    setSortModalVisible(false)
  }

  function openArtist(artist: { id?: string; name: string }) {
    router.push({
      pathname: "/artist/[name]",
      params: {
        name: artist.name,
        transitionId: resolveArtistTransitionId(artist),
      },
    })
  }

  function openAlbum(album: { id?: string; title: string }) {
    router.push({
      pathname: "/album/[name]",
      params: {
        name: album.title,
        transitionId: resolveAlbumTransitionId(album),
      },
    })
  }

  function openPlaylist(playlist: { id: string; title?: string }) {
    router.push({
      pathname: "/playlist/[id]",
      params: {
        id: playlist.id,
        transitionId: resolvePlaylistTransitionId(playlist),
      },
    })
  }

  function openPlaylistForm() {
    router.push("/playlist/form")
  }

  function openGenre(genreName: string) {
    router.push({
      pathname: "/genre/[name]",
      params: { name: genreName },
    })
  }

  function openFolder(path: string) {
    setCurrentFolderPath(path)
  }

  function goBackFolder() {
    setCurrentFolderPath((currentPath) => getParentFolderPath(currentPath))
  }

  function navigateToFolderPath(path: string) {
    setCurrentFolderPath(path)
  }

  function playFolderTrack(track: Track) {
    playTrack(track, folderTracks, {
      type: "folder",
      title: currentFolderPath.split("/").filter(Boolean).at(-1) || t("library.folders"),
    })
  }

  function getLibraryTabLabel(tab: LibraryTab) {
    switch (tab) {
      case "Tracks":
        return t("library.tracks")
      case "Albums":
        return t("library.albums")
      case "Artists":
        return t("library.artists")
      case "Genres":
        return t("library.genres")
      case "Playlists":
        return t("library.playlists")
      case "Folders":
        return t("library.folders")
      case "Favorites":
        return t("library.favorites")
    }
  }

  function playSingleTrack(track: Track, queue?: Track[]) {
    if (queue && queue.length > 0) {
      playTrack(track, queue, {
        type: "trackList",
        title: getLibraryTabLabel(activeTab),
      })
      return
    }

    const sortedTracksQueue = sortTracks(tracks, allSortConfigs.Tracks)
    if (sortedTracksQueue.length > 0) {
      playTrack(track, sortedTracksQueue, {
        type: "trackList",
        title: t("library.tracks"),
      })
      return
    }

    playTrack(track)
  }

  function appendUniqueTrack(queue: Track[], seenTrackIds: Set<string>, track: Track | undefined) {
    if (!track || seenTrackIds.has(track.id)) {
      return
    }

    seenTrackIds.add(track.id)
    queue.push(track)
  }

  async function buildFavoritesPlaybackQueue(favoriteEntries: FavoriteEntry[]): Promise<Track[]> {
    const queue: Track[] = []
    const seenTrackIds = new Set<string>()
    const trackById = new Map(tracks.map((track) => [track.id, track]))
    const playlistFavorites = favoriteEntries.filter((favorite) => favorite.type === "playlist")
    const playlistRows = await getPlaylistTrackIdsByPlaylistIds(
      playlistFavorites.map((favorite) => favorite.id)
    )
    const playlistTrackIds = new Map<string, string[]>()

    for (const row of playlistRows) {
      const currentIds = playlistTrackIds.get(row.playlistId) ?? []
      currentIds.push(row.trackId)
      playlistTrackIds.set(row.playlistId, currentIds)
    }

    for (const favorite of favoriteEntries) {
      switch (favorite.type) {
        case "track":
          appendUniqueTrack(queue, seenTrackIds, trackById.get(favorite.id))
          break
        case "album":
          for (const track of tracks) {
            if (track.albumId === favorite.id) {
              appendUniqueTrack(queue, seenTrackIds, track)
            }
          }
          break
        case "artist":
          for (const track of tracks) {
            const artistNames = (track.artist || "")
              .split(",")
              .map((name) => name.trim().toLowerCase())
            if (
              track.artistId === favorite.id ||
              artistNames.includes(favorite.name.trim().toLowerCase())
            ) {
              appendUniqueTrack(queue, seenTrackIds, track)
            }
          }
          break
        case "playlist":
          for (const trackId of playlistTrackIds.get(favorite.id) ?? []) {
            appendUniqueTrack(queue, seenTrackIds, trackById.get(trackId))
          }
          break
      }
    }

    return queue
  }

  async function playFavoriteTrack(trackId: string) {
    const queue = await buildFavoritesPlaybackQueue(filteredFavorites)
    const track = queue.find((item) => item.id === trackId)
    if (track) {
      playTrack(track, queue, {
        type: "favorites",
        title: t("library.favorites"),
      })
      return
    }

    const fallbackTrack = tracks.find((item) => item.id === trackId)
    if (fallbackTrack) {
      playTrack(fallbackTrack, queue.length > 0 ? queue : tracks, {
        type: "favorites",
        title: t("library.favorites"),
      })
    }
  }

  async function playAll() {
    if (activeTab === "Tracks") {
      const sortedTracksQueue = sortTracks(tracks, allSortConfigs.Tracks)
      if (sortedTracksQueue.length > 0) {
        playTrack(sortedTracksQueue[0], sortedTracksQueue, {
          type: "trackList",
          title: t("library.tracks"),
        })
      }
      return
    }

    if (activeTab === "Favorites") {
      const queue = await buildFavoritesPlaybackQueue(filteredFavorites)
      if (queue.length > 0) {
        playTrack(queue[0], queue, {
          type: "favorites",
          title: t("library.favorites"),
        })
      }
      return
    }

    if (tracks.length > 0) {
      playTrack(tracks[0])
    }
  }

  async function shuffle() {
    if (activeTab === "Tracks") {
      const sortedTracksQueue = sortTracks(tracks, allSortConfigs.Tracks)
      if (sortedTracksQueue.length > 0) {
        const randomIndex = Math.floor(Math.random() * sortedTracksQueue.length)
        playTrack(sortedTracksQueue[randomIndex], sortedTracksQueue, {
          type: "trackList",
          title: t("library.tracks"),
        })
      }
      return
    }

    if (activeTab === "Favorites") {
      const queue = await buildFavoritesPlaybackQueue(filteredFavorites)
      if (queue.length > 0) {
        const randomIndex = Math.floor(Math.random() * queue.length)
        playTrack(queue[randomIndex], queue, {
          type: "favorites",
          title: t("library.favorites"),
        })
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

  const sortLabel = useMemo(() => {
    const selected = currentSortOptions.find((option) => option.field === sortConfig.field)
    return selected ? t(selected.label) : t("library.sort")
  }, [currentSortOptions, sortConfig.field, t])

  const itemCount = useMemo(() => {
    switch (activeTab) {
      case "Tracks":
        return tracks.length
      case "Albums":
        return albumsData.length
      case "Artists":
        return artistsData.length
      case "Genres":
        return sortedGenres.length
      case "Favorites":
        return filteredFavorites.length
      case "Playlists":
        return playlists.length
      case "Folders":
        return folders.length + folderTracks.length
      default:
        return 0
    }
  }, [
    activeTab,
    albumsData.length,
    artistsData.length,
    filteredFavorites.length,
    folderTracks.length,
    folders.length,
    sortedGenres.length,
    playlists.length,
    tracks.length,
  ])

  async function handleRefresh() {
    if (isIndexing) {
      return
    }

    setIsPullRefreshing(true)
    try {
      await startIndexing(false, true)
      await refetchGenres()
    } finally {
      setIsPullRefreshing(false)
    }
  }

  return {
    activeTab,
    setActiveTab,
    favoriteTypeFilters,
    setFavoriteTypeFilters,
    currentFolderPath,
    setCurrentFolderPath,
    sortModalVisible,
    setSortModalVisible,
    isPullRefreshing,
    setIsPullRefreshing,
    sortConfig,
    itemCount,
    isRefreshing,
    listResetScrollKey,
    libraryListBottomPadding,
    filteredFavorites,
    availableFavoriteTypes,
    activeFavoriteTypeFilters,
    handleFavoriteTypeFiltersChange,
    sortedGenres,
    playlists,
    folders,
    folderTracks,
    folderBreadcrumbs,
    showPlayButtons,
    currentSortOptions,
    sortLabel,
    closeSortModal,
    openArtist,
    openAlbum,
    openPlaylist,
    openPlaylistForm,
    openGenre,
    openFolder,
    goBackFolder,
    navigateToFolderPath,
    playFolderTrack,
    playSingleTrack,
    playFavoriteTrack,
    playAll,
    shuffle,
    handleSortSelect,
    handleRefresh,
    getLibraryTabLabel,
  }
}
