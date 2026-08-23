import * as React from "react"
import { View } from "react-native"

import { AlbumsTab } from "@/components/blocks/albums-tab"
import { ArtistsTab } from "@/components/blocks/artists-tab"
import { LibraryGenresSection } from "@/components/blocks/library-genres-section"
import { LibraryTabBar } from "@/components/blocks/library-tab-bar"
import { TracksTab } from "@/components/blocks/tracks-tab"
import { useGuardedRouter } from "@/core/navigation"
import { getVisibleLibraryTabs, type LibraryTab } from "@/core/preferences/library-tabs"
import { usePreferenceStore } from "@/core/preferences/store"
import { useHasCurrentTrack } from "@/playback/selectors"
import { MINI_PLAYER_HEIGHT } from "@/lib/layout"

export default function LibraryScreen() {
  const router = useGuardedRouter()
  const hasMiniPlayer = useHasCurrentTrack()

  const libraryTabsConfig = usePreferenceStore((state) => state.libraryTabsConfig)
  const visibleTabs = React.useMemo(
    () => getVisibleLibraryTabs(libraryTabsConfig),
    [libraryTabsConfig]
  )
  const [activeTab, setActiveTab] = React.useState<LibraryTab>(visibleTabs[0] ?? "Tracks")

  if (!visibleTabs.includes(activeTab)) {
    setActiveTab(visibleTabs[0] ?? "Tracks")
  }

  const contentBottomPadding = 32 + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0)

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
