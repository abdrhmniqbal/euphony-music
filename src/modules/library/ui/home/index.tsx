/**
 * Purpose: Renders the Library hub with tabbed views for tracks, albums, artists, album artists, genres, playlists, folders, and filtered favorites playback.
 * Caller: Library tab route.
 * Dependencies: library queries and sorts, indexer refresh flow, themed refresh control, theme colors.
 * Main Functions: LibraryScreen()
 * Side Effects: Starts indexing on refresh, updates local folder/filter state, and starts context-aware playback.
 */

import * as React from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { AlbumsTab } from "@/components/blocks/albums-tab";
import { ArtistsTab } from "@/components/blocks/artists-tab";
import { FavoritesList } from "@/components/blocks/favorites-list";
import { FolderList } from "@/components/blocks/folder-list";
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row";
import { PlaylistList } from "@/components/blocks/playlist-list";
import { SortSheet } from "@/components/blocks/sort-sheet";
import { TracksTab } from "@/components/blocks/tracks-tab";
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet";
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control";
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/store";
import { useThemeColors } from "@/modules/ui/theme";

import { useLibraryHomeState } from "./use-library-home-state";
import { LibraryHeader } from "./library-header";
import { LibraryTabBar } from "./library-tab-bar";
import { LibraryGenresSection } from "./library-genres-section";

export default function LibraryScreen() {
  const { t } = useTranslation();
  const theme = useThemeColors();

  const state = useLibraryHomeState();

  const [actionSheetConfig, setActionSheetConfig] = React.useState<{
    visible: boolean;
    type: "album" | "artist" | "genre" | "playlist";
    id: string;
    name: string;
    subtitle?: string;
    image?: string;
    trackCount?: number;
    hideFavoriteAction?: boolean;
  } | null>(null);

  const handleListScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event.nativeEvent.contentOffset.y);
  };

  const sharedListEvents = {
    onScroll: handleListScroll,
    onScrollBeginDrag: handleScrollStart,
    onScrollEndDrag: handleScrollStop,
    onMomentumScrollEnd: handleScrollStop,
  } as const;

  const listContentContainerStyle = {
    paddingBottom: state.libraryListBottomPadding,
  };

  const refreshControl = (
    <ThemedRefreshControl
      refreshing={state.isRefreshing}
      onRefresh={() => {
        void state.handleRefresh();
      }}
    />
  );

  function renderTabContent() {
    switch (state.activeTab) {
      case "Tracks":
        return (
          <TracksTab
            sortConfig={state.sortConfig}
            onTrackPress={state.playSingleTrack}
            contentBottomPadding={state.libraryListBottomPadding}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        );
      case "Albums":
        return (
          <AlbumsTab
            sortConfig={state.sortConfig}
            onAlbumPress={state.openAlbum}
            onAlbumLongPress={(album) => {
              setActionSheetConfig({
                visible: true,
                type: "album",
                id: album.id,
                name: album.title,
                subtitle: album.artist,
                image: album.image,
                trackCount: album.trackCount,
              });
            }}
            contentBottomPadding={state.libraryListBottomPadding}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        );
      case "Artists":
        return (
          <ArtistsTab
            sortConfig={state.sortConfig}
            onArtistPress={state.openArtist}
            onArtistLongPress={(artist) => {
              setActionSheetConfig({
                visible: true,
                type: "artist",
                id: artist.id,
                name: artist.name,
                subtitle: t("library.count.track", {
                  count: artist.trackCount,
                }),
                image: artist.image,
                trackCount: artist.trackCount,
              });
            }}
            contentBottomPadding={state.libraryListBottomPadding}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        );
      case "Genres":
        return (
          <LibraryGenresSection
            genres={state.sortedGenres}
            listContentContainerStyle={listContentContainerStyle}
            refreshControl={refreshControl}
            sharedListEvents={sharedListEvents}
            mutedColor={theme.muted}
            genresEmptyTitle={t("library.empty.genresFoundTitle")}
            genresEmptyMessage={t("home.empty.recentlyPlayedMessage")}
            onGenrePress={state.openGenre}
            onGenreLongPress={(genreName) => {
              const genreObj = state.sortedGenres.find(
                (g) => g.title === genreName,
              );
              setActionSheetConfig({
                visible: true,
                type: "genre",
                id: genreName,
                name: genreName,
                subtitle: t("library.genre"),
                trackCount: genreObj?.trackCount || 0,
                hideFavoriteAction: true,
              });
            }}
          />
        );
      case "Playlists":
        return (
          <PlaylistList
            data={state.playlists}
            onCreatePlaylist={state.openPlaylistForm}
            onPlaylistPress={state.openPlaylist}
            onPlaylistLongPress={(playlist) => {
              setActionSheetConfig({
                visible: true,
                type: "playlist",
                id: playlist.id,
                name: playlist.title,
                subtitle: t("library.count.track", {
                  count: playlist.trackCount,
                }),
                image: playlist.image,
                trackCount: playlist.trackCount,
              });
            }}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={state.listResetScrollKey}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        );
      case "Folders":
        return (
          <FolderList
            data={state.folders}
            tracks={state.folderTracks}
            breadcrumbs={state.folderBreadcrumbs}
            onFolderPress={(folder) => {
              if (folder.path) {
                state.openFolder(folder.path);
              }
            }}
            onBackPress={state.goBackFolder}
            onBreadcrumbPress={state.navigateToFolderPath}
            onTrackPress={state.playFolderTrack}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={state.listResetScrollKey}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        );
      case "Favorites":
        return (
          <FavoritesList
            data={state.filteredFavorites}
            availableTypes={state.availableFavoriteTypes}
            selectedTypes={state.activeFavoriteTypeFilters}
            onSelectedTypesChange={state.handleFavoriteTypeFiltersChange}
            onTrackPress={(trackId) => {
              void state.playFavoriteTrack(trackId);
            }}
            contentContainerStyle={listContentContainerStyle}
            resetScrollKey={state.listResetScrollKey}
            refreshControl={refreshControl}
            {...sharedListEvents}
          />
        );
      default:
        return null;
    }
  }

  return (
    <>
      <SortSheet
        visible={state.sortModalVisible}
        onOpenChange={(open) =>
          open ? state.setSortModalVisible(true) : state.closeSortModal()
        }
        currentField={state.sortConfig.field}
        currentOrder={state.sortConfig.order}
        onSelect={state.handleSortSelect}
      >
        <View className="flex-1 bg-background">
          <LibraryTabBar
            tabs={state.visibleTabs}
            activeTab={state.activeTab}
            onActiveTabChange={state.setActiveTab}
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
            <View className="flex-1">{renderTabContent()}</View>
          </View>
        </View>

        <SortSheet.Content options={state.currentSortOptions} />
      </SortSheet>

      {actionSheetConfig && (
        <CollectionActionSheet
          visible={actionSheetConfig.visible}
          onOpenChange={(visible) => {
            if (!visible) {
              setActionSheetConfig(null);
              return;
            }
            setActionSheetConfig((prev) =>
              prev ? { ...prev, visible } : prev,
            );
          }}
          type={actionSheetConfig.type}
          id={actionSheetConfig.id}
          name={actionSheetConfig.name}
          subtitle={actionSheetConfig.subtitle}
          image={actionSheetConfig.image}
          trackCount={actionSheetConfig.trackCount}
          hideFavoriteAction={actionSheetConfig.hideFavoriteAction}
        />
      )}
    </>
  );
}
