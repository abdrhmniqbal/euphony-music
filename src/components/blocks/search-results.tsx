import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import * as React from "react"

import { useCallback, useMemo } from "react"
import { Keyboard, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { SearchResultsTabBar, type SearchTab } from "@/components/blocks/search-results-tab-bar"
import {
  MemoizedSearchResultRow,
  type SearchResultEntityItem,
} from "@/components/blocks/search-result-row"
import type { PlayerTrack } from "@/playback/types"
import type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/domains/search/types"

export type { SearchAlbumResult, SearchArtistResult, SearchPlaylistResult }

interface SearchResultsProps {
  tracks: PlayerTrack[]
  artists: SearchArtistResult[]
  albums: SearchAlbumResult[]
  playlists: SearchPlaylistResult[]
  query: string
  isLoading?: boolean
  activeTab?: SearchTab
  onActiveTabChange?: (tab: SearchTab) => void
  onArtistPress?: (artist: SearchArtistResult) => void
  onArtistLongPress?: (artist: SearchArtistResult) => void
  onAlbumPress?: (album: SearchAlbumResult) => void
  onAlbumLongPress?: (album: SearchAlbumResult) => void
  onPlaylistPress?: (playlist: SearchPlaylistResult) => void
  onPlaylistLongPress?: (playlist: SearchPlaylistResult) => void
  onTrackPress?: (track: PlayerTrack) => void
  onTrackLongPress?: (track: PlayerTrack) => void
}

type SearchResultsListItem =
  | { id: string; type: "section-spacer" }
  | { id: string; type: "section-header"; title: string }
  | { id: string; type: "empty" }
  | SearchResultEntityItem

function appendSection(
  listData: SearchResultsListItem[],
  options: {
    headerId: string
    title: string
    showHeader: boolean
    items: SearchResultsListItem[]
  }
) {
  if (options.items.length === 0) {
    return
  }

  if (listData.length > 0) {
    listData.push({
      id: `section-spacer-${listData.length}`,
      type: "section-spacer",
    })
  }

  if (options.showHeader) {
    listData.push({
      id: options.headerId,
      type: "section-header",
      title: options.title,
    })
  }

  listData.push(...options.items)
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  tracks,
  artists,
  albums,
  playlists,
  query,
  isLoading: _isLoading = false,
  activeTab,
  onActiveTabChange,
  onArtistPress,
  onArtistLongPress,
  onAlbumPress,
  onAlbumLongPress,
  onPlaylistPress,
  onPlaylistLongPress,
  onTrackPress,
  onTrackLongPress,
}) => {
  const { t } = useTranslation()

  const showArtists = activeTab === "All" || activeTab === "Artist"
  const showAlbums = activeTab === "All" || activeTab === "Album"
  const showPlaylists = activeTab === "All" || activeTab === "Playlist"
  const showTracks = activeTab === "All" || activeTab === "Track"
  const isAllTab = activeTab === "All"

  const hasQuery = query.trim().length > 0

  const listData = useMemo(() => {
    const nextListData: SearchResultsListItem[] = []

    if (hasQuery && showArtists && artists.length > 0) {
      appendSection(nextListData, {
        headerId: "artists-header",
        title: t("library.artists"),
        showHeader: isAllTab,
        items: artists.map((artist) => ({
          id: `artist-${artist.id}`,
          type: "artist" as const,
          artist,
        })),
      })
    }

    if (hasQuery && showAlbums && albums.length > 0) {
      appendSection(nextListData, {
        headerId: "albums-header",
        title: t("library.albums"),
        showHeader: isAllTab,
        items: albums.map((album) => ({
          id: `album-${album.id}`,
          type: "album" as const,
          album,
        })),
      })
    }

    if (hasQuery && showPlaylists && playlists.length > 0) {
      appendSection(nextListData, {
        headerId: "playlists-header",
        title: t("library.playlists"),
        showHeader: isAllTab,
        items: playlists.map((playlist) => ({
          id: `playlist-${playlist.id}`,
          type: "playlist" as const,
          playlist,
        })),
      })
    }

    if (hasQuery && showTracks && tracks.length > 0) {
      appendSection(nextListData, {
        headerId: "tracks-header",
        title: t("library.tracks"),
        showHeader: isAllTab,
        items: tracks.map((track) => ({
          id: `track-${track.id}`,
          type: "track" as const,
          track,
        })),
      })
    }

    if (nextListData.length === 0) {
      nextListData.push({ id: "empty", type: "empty" })
    }

    return nextListData
  }, [
    albums,
    artists,
    hasQuery,
    isAllTab,
    playlists,
    showAlbums,
    showArtists,
    showPlaylists,
    showTracks,
    t,
    tracks,
  ])

  const handleResultPress = useCallback(
    (item: SearchResultsListItem) => {
      switch (item.type) {
        case "artist":
          onArtistPress?.(item.artist)
          break
        case "album":
          onAlbumPress?.(item.album)
          break
        case "playlist":
          onPlaylistPress?.(item.playlist)
          break
        case "track":
          onTrackPress?.(item.track)
          break
      }
    },
    [onAlbumPress, onArtistPress, onPlaylistPress, onTrackPress]
  )

  const handleResultLongPress = useCallback(
    (item: SearchResultsListItem) => {
      switch (item.type) {
        case "artist":
          onArtistLongPress?.(item.artist)
          break
        case "album":
          onAlbumLongPress?.(item.album)
          break
        case "playlist":
          onPlaylistLongPress?.(item.playlist)
          break
        case "track":
          onTrackLongPress?.(item.track)
          break
      }
    },
    [onAlbumLongPress, onArtistLongPress, onPlaylistLongPress, onTrackLongPress]
  )

  const renderListItem = useCallback(
    ({ item }: LegendListRenderItemProps<SearchResultsListItem>) => {
      switch (item.type) {
        case "section-spacer":
          return <View className="h-5" />
        case "section-header":
          return (
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">{item.title}</Text>
            </View>
          )
        case "empty":
          return (
            <View className="pt-16">
              <Text className="text-center text-base font-semibold text-foreground">
                {t("search.noResultsTitle")}
              </Text>
              <Text className="mt-1 text-center text-sm text-muted">
                {t("search.tryDifferentKeyword")}
              </Text>
            </View>
          )
        default:
          return (
            <MemoizedSearchResultRow
              item={item}
              onPress={handleResultPress}
              onLongPress={handleResultLongPress}
            />
          )
      }
    },
    [handleResultPress, handleResultLongPress, t]
  )

  return (
    <View className="flex-1">
      <SearchResultsTabBar
        activeTab={activeTab ?? "All"}
        onActiveTabChange={onActiveTabChange ?? (() => {})}
      />
      <LegendList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        style={{ flex: 1, minHeight: 1 }}
        contentContainerStyle={{
          paddingTop: 6,
          paddingHorizontal: 16,
          paddingBottom: 104,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      />
    </View>
  )
}
