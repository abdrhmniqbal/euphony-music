import * as React from "react"
import { View } from "react-native"

import { AlbumsTab } from "@/components/blocks/albums-tab"
import { FavoritesList } from "@/components/blocks/favorites-list"
import { FoldersTab } from "@/components/blocks/folders-tab"
import { LibraryListHeader } from "@/components/blocks/library-list-header"
import { PlaylistList } from "@/components/blocks/playlist-list"
import { SortSheet } from "@/components/blocks/sort-sheet"
import {
  resolveSortLabel,
  NAME_TRACK_COUNT_SORT_OPTIONS,
  FAVORITE_SORT_OPTIONS,
} from "@/domains/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import { ArtistsTab } from "@/components/blocks/artists-tab"
import { LibraryGenresSection } from "@/components/blocks/library-genres-section"
import { LibraryTabBar } from "@/components/blocks/library-tab-bar"
import { TracksTab } from "@/components/blocks/tracks-tab"
import { useGuardedRouter } from "@/core/navigation"
import { getVisibleLibraryTabs, type LibraryTab } from "@/core/preferences/library-tabs"
import { usePreferenceStore } from "@/core/preferences/store"
import { useHasCurrentTrack } from "@/playback/selectors"
import { usePlaylistsWithOptions } from "@/domains/playlists/queries"
import { useFavorites } from "@/domains/favorites/queries"
import type { FavoriteType } from "@/domains/favorites/types"
import { getTabScreenBottomPadding } from "@/lib/layout"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"

export default function LibraryScreen() {
  const router = useGuardedRouter()
  const hasMiniPlayer = useHasCurrentTrack()
  const insets = useSafeAreaInsets()

  const libraryTabsConfig = usePreferenceStore((state) => state.libraryTabsConfig)
  const visibleTabs = React.useMemo(
    () => getVisibleLibraryTabs(libraryTabsConfig),
    [libraryTabsConfig]
  )
  const [activeTab, setActiveTab] = React.useState<LibraryTab>(visibleTabs[0] ?? "Tracks")

  if (!visibleTabs.includes(activeTab)) {
    setActiveTab(visibleTabs[0] ?? "Tracks")
  }

  const contentBottomPadding = getTabScreenBottomPadding(insets.bottom, hasMiniPlayer)

  function renderTabContent() {
    switch (activeTab) {
      case "Tracks":
        return <TracksTab contentBottomPadding={contentBottomPadding} />
      case "Albums":
        return (
          <AlbumsTab
            onAlbumPress={(album) =>
              router.push({ pathname: "/album/[name]", params: { name: album.title } })
            }
          />
        )
      case "Artists":
        return (
          <ArtistsTab
            onArtistPress={(artist) =>
              router.push({
                pathname: "/artist/[name]",
                params: { name: artist.name },
              })
            }
          />
        )
      case "Playlists":
        return (
          <PlaylistsTabContent
            contentBottomPadding={contentBottomPadding}
            onPlaylistPress={(playlist) =>
              router.push({ pathname: "/playlist/[id]", params: { id: playlist.id } })
            }
            onCreatePlaylist={() => router.push("/playlist/form")}
          />
        )
      case "Folders":
        return <FoldersTab contentBottomPadding={contentBottomPadding} />
      case "Favorites":
        return <FavoritesTabContent contentBottomPadding={contentBottomPadding} />
      case "Genres":
        return (
          <LibraryGenresSection
            contentBottomPadding={contentBottomPadding}
            onGenrePress={(genreName) =>
              router.push({ pathname: "/genre/[name]", params: { name: genreName } })
            }
          />
        )
      default:
        return null
    }
  }

  return (
    <View className="flex-1 bg-background">
      <LibraryTabBar tabs={visibleTabs} activeTab={activeTab} onActiveTabChange={setActiveTab} />
      <View className="flex-1 px-0">{renderTabContent()}</View>
    </View>
  )
}

function PlaylistsTabContent({
  contentBottomPadding,
  onPlaylistPress,
  onCreatePlaylist,
}: {
  contentBottomPadding: number
  onPlaylistPress?: (playlist: {
    id: string
    name: string
    trackCount: number
    image?: string
    images?: string[]
  }) => void
  onCreatePlaylist?: () => void
}) {
  const { t } = useTranslation()
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const sortConfig = useLibrarySortStore((state) => state.sortConfig.PlaylistsTab)
  const { data: playlists = [] } = usePlaylistsWithOptions(true)

  const sortedPlaylists = React.useMemo(() => {
    if (sortConfig.field === "trackCount") {
      const direction = sortConfig.order === "asc" ? 1 : -1
      return [...playlists].sort((a, b) => (a.trackCount - b.trackCount) * direction)
    }
    return [...playlists].sort((a, b) =>
      sortConfig.order === "asc"
        ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        : b.name.localeCompare(a.name, undefined, { sensitivity: "base" })
    )
  }, [playlists, sortConfig])

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={(field, order) => setSortConfig("PlaylistsTab", field, order)}
    >
      <View className="flex-1 px-4">
        {sortedPlaylists.length > 0 ? (
          <LibraryListHeader
            count={sortedPlaylists.length}
            sortLabel={t(
              resolveSortLabel(NAME_TRACK_COUNT_SORT_OPTIONS, sortConfig.field) || "library.sortBy"
            )}
          />
        ) : null}
        <PlaylistList
          data={sortedPlaylists}
          onPlaylistPress={onPlaylistPress}
          onCreatePlaylist={onCreatePlaylist}
          contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        />
      </View>
      <SortSheet.Content options={NAME_TRACK_COUNT_SORT_OPTIONS} />
    </SortSheet>
  )
}

const FAVORITE_TYPE_FILTERS: FavoriteType[] = ["track", "album", "artist", "playlist"]

function FavoritesTabContent({ contentBottomPadding }: { contentBottomPadding: number }) {
  const { t } = useTranslation()
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const sortConfig = useLibrarySortStore((state) => state.sortConfig.FavoritesTab)
  const [selectedTypes, setSelectedTypes] = React.useState<FavoriteType[]>([])
  const { data: favorites = [] } = useFavorites(undefined)
  const availableTypes = React.useMemo(() => {
    const present = new Set(favorites.map((entry) => entry.type))
    return FAVORITE_TYPE_FILTERS.filter((type) => present.has(type))
  }, [favorites])
  const filtered = React.useMemo(
    () =>
      selectedTypes.length > 0
        ? favorites.filter((f) => selectedTypes.includes(f.type))
        : favorites,
    [favorites, selectedTypes]
  )
  const sortedFavorites = React.useMemo(() => {
    const entries = [...filtered]
    const isAsc = sortConfig.order === "asc"
    switch (sortConfig.field) {
      case "type":
        return entries.sort((a, b) =>
          isAsc ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
        )
      case "name":
        return entries.sort((a, b) =>
          isAsc
            ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
            : b.name.localeCompare(a.name, undefined, { sensitivity: "base" })
        )
      default:
        return entries.sort((a, b) =>
          isAsc ? a.dateAdded - b.dateAdded : b.dateAdded - a.dateAdded
        )
    }
  }, [filtered, sortConfig])

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={(field, order) => setSortConfig("FavoritesTab", field, order)}
    >
      <View className="flex-1 px-4 pt-4">
        {sortedFavorites.length > 0 ? (
          <LibraryListHeader
            count={sortedFavorites.length}
            sortLabel={t(
              resolveSortLabel(FAVORITE_SORT_OPTIONS, sortConfig.field) || "library.sortBy"
            )}
          />
        ) : null}
        <FavoritesList
          data={sortedFavorites}
          availableTypes={availableTypes}
          selectedTypes={selectedTypes}
          onSelectedTypesChange={setSelectedTypes}
          contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        />
      </View>
      <SortSheet.Content options={FAVORITE_SORT_OPTIONS} />
    </SortSheet>
  )
}
