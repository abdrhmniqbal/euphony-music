import * as React from "react"
import { Tabs } from "heroui-native"
import { RefreshControl, ScrollView, Text, View } from "react-native"
import { GestureDetector } from "react-native-gesture-handler"
import { cn } from "tailwind-variants"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import {
  LIBRARY_TABS,
  LIBRARY_TAB_SORT_OPTIONS,
  useLibraryScreen,
  type LibraryTab,
} from "@/modules/library/hooks/use-library-screen"
import { PlaybackActionsRow } from "@/components/blocks"
import { AlbumsTab } from "@/components/blocks/albums-tab"
import { ArtistsTab } from "@/components/blocks/artists-tab"
import { FavoritesList } from "@/components/blocks/favorites-list"
import { FolderTab } from "@/components/blocks/folder-tab"
import { PlaylistList } from "@/components/blocks/playlist-list"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TracksTab } from "@/components/blocks/tracks-tab"

export default function LibraryScreen() {
  const theme = useThemeColors()

  const {
    activeTab,
    setActiveTab,
    sortModalVisible,
    setSortModalVisible,
    closeSortModal,
    swipeGesture,
    indexerState,
    sortConfig,
    favorites,
    playlists,
    folders,
    folderTracks,
    folderBreadcrumbs,
    refresh,
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
          <TracksTab sortConfig={sortConfig} onTrackPress={playSingleTrack} />
        )
      case "Albums":
        return (
          <AlbumsTab
            sortConfig={sortConfig}
            onAlbumPress={(album) => openAlbum(album.title)}
          />
        )
      case "Artists":
        return (
          <ArtistsTab
            sortConfig={sortConfig}
            onArtistPress={(artist) => openArtist(artist.name)}
          />
        )
      case "Playlists":
        return (
          <PlaylistList
            data={playlists}
            scrollEnabled={false}
            onCreatePlaylist={openPlaylistForm}
            onPlaylistPress={(playlist) => openPlaylist(playlist.id)}
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
          />
        )
      case "Favorites":
        return <FavoritesList data={favorites} scrollEnabled={false} />
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
      <GestureDetector gesture={swipeGesture}>
        <View className="flex-1 bg-background">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
            contentInsetAdjustmentBehavior="automatic"
            onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={indexerState.isIndexing}
                onRefresh={refresh}
                tintColor={theme.accent}
              />
            }
          >
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

            <View className="px-4 py-4">
              {showPlayButtons && (
                <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} />
              )}

              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  {activeTab === "Folders"
                    ? `${getItemCount()} Items`
                    : `${getItemCount()} ${activeTab}`}
                </Text>
                {currentSortOptions.length > 0 && (
                  <SortSheet.Trigger label={getSortLabel()} iconSize={16} />
                )}
              </View>

              {renderTabContent()}
            </View>

            <View style={{ height: 160 }} />
          </ScrollView>
        </View>
      </GestureDetector>

      <SortSheet.Content options={currentSortOptions} />
    </SortSheet>
  )
}
