/**
 * Purpose: Builds and renders tabbed search result sections for tracks, artists, album artists, albums, and playlists.
 * Caller: Search interaction route.
 * Dependencies: LegendList, search result row, HeroUI chips, localization, library/player result types.
 * Main Functions: SearchResults()
 * Side Effects: Dismisses keyboard during list/tab scrolling and delegates result presses to parent handlers.
 */

import type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/modules/library/types"
import type { Track } from "@/modules/player/store"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { Chip, PressableFeedback } from "heroui-native"
import * as React from "react"

import { useCallback, useMemo, useState } from "react"
import { Keyboard, ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { LEGEND_LIST_SECTION_CONFIG } from "@/components/blocks/legend-list-config"
import { MemoizedSearchResultRow } from "@/components/patterns/search-result-row"

export type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/modules/library/types"

const SEARCH_TABS = ["All", "Track", "Album", "Artist", "Playlist"] as const
export type SearchTab = (typeof SEARCH_TABS)[number]

interface SearchResultsProps {
  tracks: Track[]
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
  onTrackPress?: (track: Track) => void
  onTrackLongPress?: (track: Track) => void
  onSeeMoreTracks?: () => void
}

type SearchResultsListItem =
  | { id: string; type: "section-spacer" }
  | { id: string; type: "section-header"; title: string; showSeeMore?: boolean }
  | { id: string; type: "artist"; artist: SearchArtistResult }
  | { id: string; type: "album"; album: SearchAlbumResult }
  | { id: string; type: "playlist"; playlist: SearchPlaylistResult }
  | { id: string; type: "track"; track: Track }

function appendSection(
  listData: SearchResultsListItem[],
  options: {
    headerId: string
    title: string
    showHeader: boolean
    showSeeMore?: boolean
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
      showSeeMore: options.showSeeMore,
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
  activeTab: activeTabProp,
  onActiveTabChange,
  onArtistPress,
  onArtistLongPress,
  onAlbumPress,
  onAlbumLongPress,
  onPlaylistPress,
  onPlaylistLongPress,
  onTrackPress,
  onTrackLongPress,
  onSeeMoreTracks,
}) => {
  const { t } = useTranslation()
  const [internalActiveTab, setInternalActiveTab] = useState<SearchTab>("All")
  const activeTab = activeTabProp ?? internalActiveTab

  function getSearchTabLabel(tab: SearchTab) {
    switch (tab) {
      case "All":
        return t("search.tabs.all")
      case "Track":
        return t("search.tabs.track")
      case "Album":
        return t("search.tabs.album")
      case "Artist":
        return t("search.tabs.artist")
      case "Playlist":
        return t("search.tabs.playlist")
    }
  }

  const setActiveTab = useCallback(
    (tab: SearchTab) => {
      if (onActiveTabChange) {
        onActiveTabChange(tab)
        return
      }

      setInternalActiveTab(tab)
    },
    [onActiveTabChange]
  )

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
        showHeader: isAllTab || Boolean(onSeeMoreTracks),
        showSeeMore: Boolean(onSeeMoreTracks),
        items: tracks.map((track) => ({
          id: `track-${track.id}`,
          type: "track" as const,
          track,
        })),
      })
    }

    return nextListData
  }, [
    albums,
    artists,
    hasQuery,
    isAllTab,
    onSeeMoreTracks,
    playlists,
    showAlbums,
    showArtists,
    showPlaylists,
    showTracks,
    t,
    tracks,
  ])

  const renderListItem = useCallback(
    ({ item }: LegendListRenderItemProps<SearchResultsListItem>) => {
      switch (item.type) {
        case "section-spacer":
          return <View className="h-5" />
        case "section-header":
          return (
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">{item.title}</Text>
              {item.showSeeMore && onSeeMoreTracks && (
                <PressableFeedback onPress={onSeeMoreTracks}>
                  <Text className="text-xs text-muted">{t("common.seeMore")}</Text>
                </PressableFeedback>
              )}
            </View>
          )
        default:
          return (
            <MemoizedSearchResultRow
              item={item}
              onArtistPress={onArtistPress}
              onArtistLongPress={onArtistLongPress}
              onAlbumPress={onAlbumPress}
              onAlbumLongPress={onAlbumLongPress}
              onPlaylistPress={onPlaylistPress}
              onPlaylistLongPress={onPlaylistLongPress}
              onTrackPress={onTrackPress}
              onTrackLongPress={onTrackLongPress}
            />
          )
      }
    },
    [
      onAlbumPress,
      onAlbumLongPress,
      onArtistPress,
      onArtistLongPress,
      onPlaylistPress,
      onPlaylistLongPress,
      onSeeMoreTracks,
      onTrackPress,
      onTrackLongPress,
      t,
    ]
  )

  return (
    <View className="flex-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => Keyboard.dismiss()}
        className="pt-3 pb-4"
        style={{ flexGrow: 0 }}
      >
        {SEARCH_TABS.map((tab) => (
          <Chip
            key={tab}
            onPress={() => setActiveTab(tab)}
            variant={activeTab === tab ? "primary" : "soft"}
            color={activeTab === tab ? "accent" : "default"}
            size="lg"
          >
            <Chip.Label className="font-medium">{getSearchTabLabel(tab)}</Chip.Label>
          </Chip>
        ))}
      </ScrollView>
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
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        {...LEGEND_LIST_SECTION_CONFIG}
      />
    </View>
  )
}
