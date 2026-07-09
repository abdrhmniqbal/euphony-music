/**
 * Purpose: Renders the Library hub with tabbed views for tracks, albums, artists, album artists, genres, playlists, folders, and filtered favorites playback.
 * Caller: Library tab route.
 * Dependencies: library queries and sorts, indexer refresh flow, themed refresh control, theme colors.
 * Main Functions: LibraryScreen()
 * Side Effects: Starts indexing on refresh, updates local folder/filter state, and starts context-aware playback.
 */

import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { AlbumsTab } from "@/components/blocks/albums-tab"
import { ArtistsTab } from "@/components/blocks/artists-tab"
import { FavoritesList } from "@/components/blocks/favorites-list"
import { FolderList } from "@/components/blocks/folder-list"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { PlaylistList } from "@/components/blocks/playlist-list"
import { SortSheet } from "@/components/blocks/sheets/sort-sheet"
import { TracksTab } from "@/components/blocks/tracks-tab"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"
import { useThemeColors } from "@/modules/ui/theme"

import { useLibraryHomeState } from "./use-library-home-state"
import { LibraryHeader } from "./library-header"
import { LibraryTabBar } from "./library-tab-bar"
import { LibraryGenresSection } from "./library-genres-section"

export default function LibraryScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()

  const state = useLibraryHomeState()

  const handleActiveTabChange = (nextTab: typeof state.activeTab) => {
    state.setActiveTab(nextTab)
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  const listContentContainerStyle = {
    paddingBottom: state.libraryListBottomPadding,
  }

  const refreshControl = (
    <ThemedRefreshControl
      refreshing={state.isRefreshing}
      onRefresh={() => {
        void state.handleRefresh()
      }}
    />
  )

  function renderTabContent() {
    switch (state.activeTab) {
      case "Tracks":
        return (
          <TracksTab
            sortConfig={state.sortConfig}
            onTrackPress={state.playSingleTrack}
            contentBottomPadding={state.libraryListBottomPadding}
            refreshControl={refreshControl}
            {...autoHideScrollProps}
          />
        )
      case "Albums":
        return (
          <AlbumsTab
            sortConfig={state.sortConfig}
            onAlbumPress={state.openAlbum}
            contentBottomPadding={state.libraryListBottomPadding}
            refreshControl={refreshControl}
            {...autoHideScrollProps}
          />
        )
      case "Artists":
        return (
          <ArtistsTab
            sortConfig={state.sortConfig}
            onArtistPress={state.openArtist}
            contentBottomPadding={state.libraryListBottomPadding}
            refreshControl={refreshControl}
            {...autoHideScrollProps}
          />
        )
      case "Genres":
        return (
          <LibraryGenresSection
            genres={state.sortedGenres}
            listContentContainerStyle={listContentContainerStyle}
            refreshControl={refreshControl}
            sharedListEvents={autoHideScrollProps}
            mutedColor={theme.muted}
            genresEmptyTitle={t("library.empty.genresFoundTitle")}
            genresEmptyMessage={t("home.empty.recentlyPlayedMessage")}
            onGenrePress={state.openGenre}
          />
        )
      case "Playlists":
        return (
          <PlaylistList
            data={state.playlists}
            onCreatePlaylist={state.openPlaylistForm}
            onPlaylistPress={state.openPlaylist}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={state.listResetScrollKey}
            refreshControl={refreshControl}
            {...autoHideScrollProps}
          />
        )
      case "Folders":
        return (
          <FolderList
            data={state.folders}
            tracks={state.folderTracks}
            breadcrumbs={state.folderBreadcrumbs}
            onFolderPress={(folder) => {
              if (folder.path) {
                state.openFolder(folder.path)
              }
            }}
            onBackPress={state.goBackFolder}
            onBreadcrumbPress={state.navigateToFolderPath}
            onTrackPress={state.playFolderTrack}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={state.listResetScrollKey}
            refreshControl={refreshControl}
            {...autoHideScrollProps}
          />
        )
      case "Favorites":
        return (
          <FavoritesList
            data={state.filteredFavorites}
            availableTypes={state.availableFavoriteTypes}
            selectedTypes={state.activeFavoriteTypeFilters}
            onSelectedTypesChange={state.handleFavoriteTypeFiltersChange}
            onTrackPress={(trackId) => {
              void state.playFavoriteTrack(trackId)
            }}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={state.listResetScrollKey}
            refreshControl={refreshControl}
            {...autoHideScrollProps}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <SortSheet
        visible={state.sortModalVisible}
        onOpenChange={(open) => (open ? state.setSortModalVisible(true) : state.closeSortModal())}
        currentField={state.sortConfig.field}
        currentOrder={state.sortConfig.order}
        onSelect={state.handleSortSelect}
      >
        <View className="flex-1 bg-background">
          <LibraryTabBar
            tabs={state.visibleTabs}
            activeTab={state.activeTab}
            onActiveTabChange={handleActiveTabChange}
            getLibraryTabLabel={state.getLibraryTabLabel}
          />

          <LibraryHeader
            activeTab={state.activeTab}
            itemCount={state.itemCount}
            getLibraryTabLabel={state.getLibraryTabLabel}
            currentSortOptions={state.currentSortOptions}
            sortLabel={state.sortLabel}
          />

          <View className="flex-1 px-4">
            {state.showPlayButtons && (
              <View className="mb-4">
                <PlaybackActionsRow
                  onPlay={state.playAll}
                  onShuffle={state.shuffle}
                  className="mb-0"
                />
              </View>
            )}
            <View className="flex-1 overflow-hidden">
              <View key={state.activeTab} className="flex-1">
                {renderTabContent()}
              </View>
            </View>
          </View>
        </View>

        <SortSheet.Content options={state.currentSortOptions} />
      </SortSheet>
    </>
  )
}
