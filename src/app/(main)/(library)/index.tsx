/**
 * Purpose: Renders the Library hub with tabbed views for tracks, albums, artists, genres, playlists, folders, and filtered favorites playback.
 * Caller: Library tab route.
 * Dependencies: library queries and sorts, indexer refresh flow, themed refresh control, theme colors.
 * Main Functions: LibraryScreen()
 * Side Effects: Starts indexing on refresh, updates local folder/filter state, and starts context-aware playback.
 */

import type { Playlist } from "@/components/blocks/playlist-list"
import type { FavoriteEntry, FavoriteType } from "@/modules/favorites/types"
import type { GenreCategory } from "@/modules/genres/types"
import type { SortField } from "@/modules/library/sort.types"
import type { Track } from "@/modules/player/store"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Tabs } from "heroui-native"

import * as React from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"
import { AlbumsTab } from "@/components/blocks/albums-tab"
import { ArtistsTab } from "@/components/blocks/artists-tab"
import { FavoritesList } from "@/components/blocks/favorites-list"
import { FolderList } from "@/components/blocks/folder-list"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { PlaylistList } from "@/components/blocks/playlist-list"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TracksTab } from "@/components/blocks/tracks-tab"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { GenreCard } from "@/components/patterns/genre-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { getTabBarHeight, MINI_PLAYER_HEIGHT } from "@/constants/layout"
import {
  resolveAlbumTransitionId,
  resolveArtistTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import { useFavorites } from "@/modules/favorites/queries"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { buildFolderBrowserState, getParentFolderPath } from "@/modules/library/folder-browser"
import {
  ALBUM_SORT_OPTIONS,
  ARTIST_SORT_OPTIONS,
  FAVORITE_SORT_OPTIONS,
  FOLDER_SORT_OPTIONS,
  GENRE_SORT_OPTIONS,
  PLAYLIST_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
} from "@/modules/library/sort.constants"
import { setSortConfig, useLibrarySortStore } from "@/modules/library/sort.store"
import { sortGeneric, sortTracks } from "@/modules/library/sort.utils"
import { useAlbums, useArtists } from "@/modules/library/queries"
import { useHasCurrentTrack, usePlayerTracks } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { usePlaylistsWithOptions } from "@/modules/playlist/queries"
import { getPlaylistTrackIdsByPlaylistIds } from "@/modules/playlist/repository"
import { useGenres } from "@/modules/genres/queries"
import { mapGenresToCategories } from "@/modules/genres/utils"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"

const LIBRARY_TABS = [
  "Tracks",
  "Albums",
  "Artists",
  "Genres",
  "Playlists",
  "Folders",
  "Favorites",
] as const
type LibraryTab = (typeof LIBRARY_TABS)[number]

interface LibrarySortOption {
  label: string
  field: SortField
}

function getAlbumOrderByField(
  field: SortField
): "title" | "artist" | "year" | "trackCount" | "dateAdded" {
  if (field === "artist") {
    return "artist"
  }

  if (field === "year") {
    return "year"
  }

  if (field === "trackCount") {
    return "trackCount"
  }

  if (field === "dateAdded") {
    return "dateAdded"
  }

  return "title"
}

function getArtistOrderByField(field: SortField): "name" | "trackCount" | "dateAdded" {
  if (field === "trackCount") {
    return "trackCount"
  }

  if (field === "dateAdded") {
    return "dateAdded"
  }

  return "name"
}

const LIBRARY_SORT_OPTIONS: Record<LibraryTab, LibrarySortOption[]> = {
  Tracks: TRACK_SORT_OPTIONS,
  Albums: ALBUM_SORT_OPTIONS,
  Artists: ARTIST_SORT_OPTIONS,
  Genres: GENRE_SORT_OPTIONS,
  Playlists: PLAYLIST_SORT_OPTIONS,
  Folders: FOLDER_SORT_OPTIONS,
  Favorites: FAVORITE_SORT_OPTIONS,
}

export default function LibraryScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const theme = useThemeColors()
  const insets = useSafeAreaInsets()
  const hasMiniPlayer = useHasCurrentTrack()
  const tracks = usePlayerTracks()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const tabBarHeight = getTabBarHeight(insets.bottom)
  const libraryListBottomPadding = tabBarHeight + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0) + 200
  const [activeTab, setActiveTab] = React.useState<LibraryTab>("Tracks")
  const [favoriteTypeFilters, setFavoriteTypeFilters] = React.useState<FavoriteType[]>([])
  const [currentFolderPath, setCurrentFolderPath] = React.useState("")
  const [sortModalVisible, setSortModalVisible] = React.useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = React.useState(false)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const sortConfig = allSortConfigs[activeTab]
  const shouldLoadFavorites = activeTab === "Favorites"
  const shouldLoadAlbums = activeTab === "Albums"
  const shouldLoadArtists = activeTab === "Artists"
  const shouldLoadPlaylists = activeTab === "Playlists"

  const { data: favorites = [] } = useFavorites(undefined, {
    enabled: shouldLoadFavorites,
  })
  const availableFavoriteTypes = React.useMemo<FavoriteType[]>(
    () => [...new Set(favorites.map((favorite) => favorite.type))],
    [favorites]
  )
  const activeFavoriteTypeFilters = React.useMemo(
    () => favoriteTypeFilters.filter((type) => availableFavoriteTypes.includes(type)),
    [availableFavoriteTypes, favoriteTypeFilters]
  )
  const handleFavoriteTypeFiltersChange = React.useCallback(
    (types: FavoriteType[]) => {
      setFavoriteTypeFilters(types.filter((type) => availableFavoriteTypes.includes(type)))
    },
    [availableFavoriteTypes]
  )
  const filteredFavorites = React.useMemo(() => {
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

  const genres = React.useMemo<GenreCategory[]>(
    () => mapGenresToCategories(genresData),
    [genresData]
  )

  const sortedGenres = React.useMemo<GenreCategory[]>(() => {
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

  const playlists = React.useMemo<Playlist[]>(
    () => sortGeneric(playlistsData, allSortConfigs.Playlists),
    [allSortConfigs.Playlists, playlistsData]
  )

  const {
    folders,
    tracks: folderTracks,
    breadcrumbs: folderBreadcrumbs,
  } = React.useMemo(
    () => buildFolderBrowserState(tracks, currentFolderPath, allSortConfigs.Folders),
    [allSortConfigs.Folders, currentFolderPath, tracks]
  )

  const showPlayButtons = activeTab === "Tracks" || activeTab === "Favorites"

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
  const currentSortOptions =
    activeTab === "Genres" ? GENRE_SORT_OPTIONS : LIBRARY_SORT_OPTIONS[activeTab]
  const handleListScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event.nativeEvent.contentOffset.y)
  }
  const isRefreshing = isPullRefreshing || isIndexing
  const sharedListEvents = {
    onScroll: handleListScroll,
    onScrollBeginDrag: handleScrollStart,
    onScrollEndDrag: handleScrollStop,
    onMomentumScrollEnd: handleScrollStop,
  } as const
  const listContentContainerStyle = {
    paddingBottom: libraryListBottomPadding,
  }
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

  const sortLabel = React.useMemo(() => {
    const selected = currentSortOptions.find((option) => option.field === sortConfig.field)
    return selected ? t(selected.label) : t("library.sort")
  }, [currentSortOptions, sortConfig.field, t])

  const itemCount = React.useMemo(() => {
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

  const refreshControl = (
    <ThemedRefreshControl
      refreshing={isRefreshing}
      onRefresh={() => {
        void handleRefresh()
      }}
    />
  )

  function renderTabContent() {
    switch (activeTab) {
      case "Tracks":
        return (
          <TracksTab
            sortConfig={sortConfig}
            onTrackPress={playSingleTrack}
            contentBottomPadding={libraryListBottomPadding}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        )
      case "Albums":
        return (
          <AlbumsTab
            sortConfig={sortConfig}
            onAlbumPress={openAlbum}
            contentBottomPadding={libraryListBottomPadding}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        )
      case "Artists":
        return (
          <ArtistsTab
            sortConfig={sortConfig}
            onArtistPress={openArtist}
            contentBottomPadding={libraryListBottomPadding}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        )
      case "Genres":
        return (
          <ScrollView
            className="flex-1"
            contentContainerStyle={listContentContainerStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={refreshControl}
            {...sharedListEvents}
          >
            {sortedGenres.length > 0 ? (
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {sortedGenres.map((genre) => (
                  <GenreCard
                    key={genre.id}
                    title={genre.title}
                    trackCount={genre.trackCount}
                    color={genre.color}
                    pattern={genre.pattern}
                    onPress={() => openGenre(genre.title)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={
                  <LocalMusicNoteSolidIcon fill="none" width={48} height={48} color={theme.muted} />
                }
                title={t("library.empty.genresFoundTitle")}
                message={t("home.empty.recentlyPlayedMessage")}
                className="mt-8"
              />
            )}
          </ScrollView>
        )
      case "Playlists":
        return (
          <PlaylistList
            data={playlists}
            onCreatePlaylist={openPlaylistForm}
            onPlaylistPress={openPlaylist}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={listResetScrollKey}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        )
      case "Folders":
        return (
          <FolderList
            data={folders}
            tracks={folderTracks}
            breadcrumbs={folderBreadcrumbs}
            onFolderPress={(folder) => {
              if (folder.path) {
                openFolder(folder.path)
              }
            }}
            onBackPress={goBackFolder}
            onBreadcrumbPress={navigateToFolderPath}
            onTrackPress={playFolderTrack}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={listResetScrollKey}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        )
      case "Favorites":
        return (
          <FavoritesList
            data={filteredFavorites}
            availableTypes={availableFavoriteTypes}
            selectedTypes={activeFavoriteTypeFilters}
            onSelectedTypesChange={handleFavoriteTypeFiltersChange}
            onTrackPress={(trackId) => {
              void playFavoriteTrack(trackId)
            }}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={listResetScrollKey}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        )
      default:
        return null
    }
  }

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={(open) => (open ? setSortModalVisible(true) : closeSortModal())}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as LibraryTab)}
          variant="secondary"
          className="gap-1.5 px-4 py-4"
        >
          <Tabs.List className="w-full">
            <Tabs.ScrollView
              scrollAlign="start"
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-1 gap-4"
            >
              <Tabs.Indicator />
              {LIBRARY_TABS.map((tab) => (
                <Tabs.Trigger key={tab} value={tab} className="py-2">
                  {({ isSelected }) => (
                    <Tabs.Label
                      className={cn(
                        "text-lg font-semibold",
                        isSelected ? "text-foreground" : "text-muted"
                      )}
                    >
                      {getLibraryTabLabel(tab)}
                    </Tabs.Label>
                  )}
                </Tabs.Trigger>
              ))}
            </Tabs.ScrollView>
          </Tabs.List>
        </Tabs>

        <View className="flex-row items-center justify-between px-4 pb-4">
          <Text className="text-lg font-bold text-foreground">
            {activeTab === "Folders"
              ? t("library.items", { count: itemCount })
              : `${itemCount} ${getLibraryTabLabel(activeTab)}`}
          </Text>
          {currentSortOptions.length > 0 && <SortSheet.Trigger label={sortLabel} iconSize={16} />}
        </View>

        <View className="flex-1 px-4">
          {showPlayButtons && (
            <View className="mb-4">
              <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} className="mb-0" />
            </View>
          )}
          <View className="flex-1">{renderTabContent()}</View>
        </View>
      </View>

      <SortSheet.Content options={currentSortOptions} />
    </SortSheet>
  )
}
