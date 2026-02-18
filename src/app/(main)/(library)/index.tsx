import * as React from "react"
import { useStore } from "@nanostores/react"
import { Tabs } from "heroui-native"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { cn } from "tailwind-variants"

import { MINI_PLAYER_HEIGHT, getTabBarHeight } from "@/constants/layout"
import {
  LIBRARY_TABS,
  LIBRARY_TAB_SORT_OPTIONS,
  useLibraryScreen,
  type LibraryTab,
} from "@/modules/library/hooks/use-library-screen"
import { $currentTrack } from "@/modules/player/player.store"
import { PlaybackActionsRow } from "@/components/blocks"
import { AlbumsTab } from "@/components/blocks/albums-tab"
import { ArtistsTab } from "@/components/blocks/artists-tab"
import { FavoritesList } from "@/components/blocks/favorites-list"
import { FolderTab } from "@/components/blocks/folder-tab"
import { PlaylistList } from "@/components/blocks/playlist-list"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TracksTab } from "@/components/blocks/tracks-tab"

export default function LibraryScreen() {
  const insets = useSafeAreaInsets()
  const currentTrack = useStore($currentTrack)
  const tabBarHeight = getTabBarHeight(insets.bottom)
  const hasMiniPlayer = currentTrack !== null
  const libraryListBottomPadding =
    tabBarHeight + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0) + 16

  const {
    activeTab,
    setActiveTab,
    sortModalVisible,
    setSortModalVisible,
    closeSortModal,
    sortConfig,
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
  } = useLibraryScreen()

  const showPlayButtons = activeTab === "Tracks" || activeTab === "Favorites"
  const currentSortOptions = LIBRARY_TAB_SORT_OPTIONS[activeTab]

  function renderTabContent() {
    switch (activeTab) {
      case "Tracks":
        return (
          <TracksTab
            sortConfig={sortConfig}
            onTrackPress={playSingleTrack}
            contentBottomPadding={libraryListBottomPadding}
          />
        )
      case "Albums":
        return (
          <AlbumsTab
            sortConfig={sortConfig}
            onAlbumPress={(album) => openAlbum(album.title)}
            contentBottomPadding={libraryListBottomPadding}
          />
        )
      case "Artists":
        return (
          <ArtistsTab
            sortConfig={sortConfig}
            onArtistPress={(artist) => openArtist(artist.name)}
            contentBottomPadding={libraryListBottomPadding}
          />
        )
      case "Playlists":
        return (
          <PlaylistList
            data={playlists}
            onCreatePlaylist={openPlaylistForm}
            onPlaylistPress={(playlist) => openPlaylist(playlist.id)}
            contentContainerStyle={{ paddingBottom: libraryListBottomPadding }}
            resetScrollKey={`${sortConfig.field}-${sortConfig.order}`}
          />
        )
      case "Folders":
        return (
          <FolderTab
            folders={folders}
            folderTracks={folderTracks}
            folderBreadcrumbs={folderBreadcrumbs}
            onOpenFolder={openFolder}
            onBackFolder={goBackFolder}
            onNavigateToFolderPath={navigateToFolderPath}
            onTrackPress={playFolderTrack}
            contentContainerStyle={{ paddingBottom: libraryListBottomPadding }}
            resetScrollKey={`${sortConfig.field}-${sortConfig.order}`}
          />
        )
      case "Favorites":
        return (
          <FavoritesList
            data={favorites}
            contentContainerStyle={{ paddingBottom: libraryListBottomPadding }}
          />
        )
      default:
        return null
    }
  }

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={(open) =>
        open ? setSortModalVisible(true) : closeSortModal()
      }
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
                      {tab}
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
              ? `${getItemCount()} Items`
              : `${getItemCount()} ${activeTab}`}
          </Text>
          {currentSortOptions.length > 0 && (
            <SortSheet.Trigger label={getSortLabel()} iconSize={16} />
          )}
        </View>

        <View className="flex-1 px-4">
          {showPlayButtons && (
            <View className="mb-4">
              <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} />
            </View>
          )}
          {renderTabContent()}
        </View>
      </View>

      <SortSheet.Content options={currentSortOptions} />
    </SortSheet>
  )
}
