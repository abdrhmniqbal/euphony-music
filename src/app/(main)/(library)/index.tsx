import * as React from "react"
import { View } from "react-native"

import { AlbumsTab } from "@/components/blocks/albums-tab"
import { FoldersTab } from "@/components/blocks/folders-tab"
import { PlaylistList } from "@/components/blocks/playlist-list"
import { FavoritesList } from "@/components/blocks/favorites-list"
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
  const { data: playlists = [] } = usePlaylistsWithOptions(true)
  return (
    <View className="flex-1 px-4">
      <PlaylistList
        data={playlists}
        onPlaylistPress={onPlaylistPress}
        onCreatePlaylist={onCreatePlaylist}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      />
    </View>
  )
}

const FAVORITE_TYPE_FILTERS: FavoriteType[] = ["track", "album", "artist", "playlist"]

function FavoritesTabContent({ contentBottomPadding }: { contentBottomPadding: number }) {
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

  return (
    <View className="flex-1 px-4 pt-4">
      <FavoritesList
        data={filtered}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={setSelectedTypes}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      />
    </View>
  )
}
