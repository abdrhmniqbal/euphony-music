import { Input, PressableFeedback, useThemeColor } from "heroui-native"
import * as React from "react"
import { useRef, useState } from "react"
import { Keyboard, ScrollView, type TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalArrowLeft02Icon from "@/components/icons/local/arrow-left-02"
import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import {
  SearchResults,
  type SearchAlbumResult,
  type SearchArtistResult,
  type SearchPlaylistResult,
} from "@/components/blocks/search-results"
import { RecentSearches, type RecentSearchItem } from "@/components/blocks/recent-searches"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { useGuardedRouter } from "@/core/navigation"
import type { PlayerTrack } from "@/playback/types"
import { createPlaybackQueueContext } from "@/playback/types"
import { playTrack } from "@/playback/service"
import {
  useAddRecentSearch,
  useClearRecentSearches,
  useDeleteRecentSearch,
  useRecentSearches,
  useSearch,
} from "@/domains/search/queries"

interface HeaderSearchInputProps {
  initialValue: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onBack: () => void
  focusWhenReady: boolean
}

function HeaderSearchInput({
  initialValue,
  onChangeText,
  onSubmit,
  onBack,
  focusWhenReady,
}: HeaderSearchInputProps) {
  const { t } = useTranslation()
  const [accent, foreground, muted] = useThemeColor(["accent", "foreground", "muted"])
  const [inputValue, setInputValue] = React.useState(initialValue)
  const inputRef = useRef<TextInput>(null)

  function handleChangeText(text: string) {
    setInputValue(text)
    onChangeText(text)
  }

  function handleClear() {
    setInputValue("")
    onChangeText("")
  }

  return (
    <View className="relative">
      <View className="relative">
        <PressableFeedback
          onPress={onBack}
          className="absolute inset-y-0 left-1 z-20 w-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t("common.goBack")}
        >
          <LocalArrowLeft02Icon fill="none" width={24} height={24} color={foreground} />
        </PressableFeedback>

        <Input
          ref={inputRef}
          placeholder={t("search.searchPlaceholder")}
          placeholderTextColor={muted}
          value={inputValue}
          onChangeText={handleChangeText}
          onSubmitEditing={onSubmit}
          className="pl-12 pr-10"
          selectionColor={accent}
          returnKeyType="search"
          autoFocus={focusWhenReady && initialValue.trim().length === 0}
        />
        {inputValue.length > 0 ? (
          <PressableFeedback
            onPress={handleClear}
            className="absolute inset-y-0 right-2.5 justify-center p-1"
          >
            <LocalCancelCircleSolidIcon fill="none" width={20} height={20} color={muted} />
          </PressableFeedback>
        ) : null}
      </View>
    </View>
  )
}

export function SearchInteractionScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useGuardedRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchTab, setActiveSearchTab] = useState<
    "All" | "Track" | "Album" | "Artist" | "Playlist"
  >("All")
  const [canAutoFocusInput] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState<PlayerTrack | null>(null)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)
  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean
    type: "album" | "artist" | "playlist"
    id: string
    name: string
    subtitle?: string
    image?: string
    images?: string[]
    trackCount?: number
  } | null>(null)

  const { data: searchResults } = useSearch(searchQuery)
  const { data: recentSearchesData = [] } = useRecentSearches()
  const recentSearches = recentSearchesData

  const addRecentSearchMutation = useAddRecentSearch()
  const deleteRecentSearchMutation = useDeleteRecentSearch()
  const clearRecentSearchesMutation = useClearRecentSearches()

  const tracks = searchResults?.tracks ?? []
  const artists = searchResults?.artists ?? []
  const albums = searchResults?.albums ?? []
  const playlists = searchResults?.playlists ?? []

  const isSearching = searchQuery.trim().length > 0

  function dismissKeyboard() {
    Keyboard.dismiss()
  }

  function pushRecentSearch(item: RecentSearchItem) {
    if (!item.query.trim()) {
      return
    }

    void addRecentSearchMutation.mutateAsync(item)
  }

  function handleSubmitSearch() {
    const query = searchQuery.trim()
    if (!query) {
      return
    }

    pushRecentSearch({
      id: "",
      query,
      title: query,
      subtitle: t("navigation.tabs.search"),
    })
  }

  function handleRecentItemPress(item: RecentSearchItem) {
    dismissKeyboard()
    pushRecentSearch(item)

    if (item.type === "artist" && item.query.trim()) {
      router.push({ pathname: "/artist/[name]", params: { name: item.query } })
      return
    }
    if (item.type === "album" && item.query.trim()) {
      router.push({ pathname: "/album/[name]", params: { name: item.query } })
      return
    }
    if (item.type === "playlist" && item.targetId) {
      router.push({ pathname: "/playlist/[id]", params: { id: item.targetId } })
      return
    }

    setSearchQuery(item.query)
  }

  function handleArtistPress(artist: SearchArtistResult) {
    dismissKeyboard()
    pushRecentSearch({
      id: "",
      query: artist.name,
      title: artist.name,
      subtitle: t("library.count.track", { count: artist.trackCount }),
      type: "artist",
      targetId: artist.id,
      image: artist.image,
    })
    router.push({ pathname: "/artist/[name]", params: { name: artist.name } })
  }

  function handleAlbumPress(album: SearchAlbumResult) {
    dismissKeyboard()
    pushRecentSearch({
      id: "",
      query: album.title,
      title: album.title,
      subtitle: album.artist || t("library.favoriteType.album"),
      type: "album",
      targetId: album.id,
      image: album.image,
    })
    router.push({ pathname: "/album/[name]", params: { name: album.title } })
  }

  function handlePlaylistPress(playlist: SearchPlaylistResult) {
    dismissKeyboard()
    pushRecentSearch({
      id: "",
      query: playlist.title,
      title: playlist.title,
      subtitle: t("library.count.track", { count: playlist.trackCount }),
      type: "playlist",
      targetId: playlist.id,
      image: playlist.image || playlist.images?.[0],
      images: playlist.images,
    })
    router.push({ pathname: "/playlist/[id]", params: { id: playlist.id } })
  }

  function handleArtistLongPress(artist: SearchArtistResult) {
    dismissKeyboard()
    setActionSheetConfig({
      visible: true,
      type: "artist",
      id: artist.id,
      name: artist.name,
      subtitle: t("library.count.track", { count: artist.trackCount }),
      image: artist.image,
      trackCount: artist.trackCount,
    })
  }

  function handleAlbumLongPress(album: SearchAlbumResult) {
    dismissKeyboard()
    setActionSheetConfig({
      visible: true,
      type: "album",
      id: album.id,
      name: album.title,
      subtitle: album.artist || t("library.unknownArtist"),
      image: album.image,
    })
  }

  function handlePlaylistLongPress(playlist: SearchPlaylistResult) {
    dismissKeyboard()
    setActionSheetConfig({
      visible: true,
      type: "playlist",
      id: playlist.id,
      name: playlist.title,
      subtitle: t("library.count.track", { count: playlist.trackCount }),
      image: playlist.image || playlist.images?.[0],
      images: playlist.images,
      trackCount: playlist.trackCount,
    })
  }

  function handleTrackPress(track: PlayerTrack) {
    dismissKeyboard()
    playTrack(track, tracks, createPlaybackQueueContext("search", t("navigation.tabs.search")))
  }

  function handleTrackLongPress(track: PlayerTrack) {
    dismissKeyboard()
    setSelectedTrack(track)
    setIsTrackSheetOpen(true)
  }

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
        <HeaderSearchInput
          initialValue={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSubmitSearch}
          onBack={() => {
            dismissKeyboard()
            router.back()
          }}
          focusWhenReady={canAutoFocusInput}
        />
      </View>
      {isSearching ? (
        <SearchResults
          tracks={tracks}
          artists={artists}
          albums={albums}
          playlists={playlists}
          query={searchQuery}
          activeTab={activeSearchTab}
          onActiveTabChange={setActiveSearchTab}
          onTrackPress={handleTrackPress}
          onTrackLongPress={handleTrackLongPress}
          onArtistPress={handleArtistPress}
          onArtistLongPress={handleArtistLongPress}
          onAlbumPress={handleAlbumPress}
          onAlbumLongPress={handleAlbumLongPress}
          onPlaylistPress={handlePlaylistPress}
          onPlaylistLongPress={handlePlaylistLongPress}
        />
      ) : (
        <ScrollView
          className="flex-1 pt-4"
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={dismissKeyboard}
        >
          <RecentSearches
            searches={recentSearches}
            onClear={() => void clearRecentSearchesMutation.mutateAsync()}
            onItemPress={handleRecentItemPress}
            onRemoveItem={(id) => void deleteRecentSearchMutation.mutateAsync(id)}
          />
        </ScrollView>
      )}
      <CollectionActionSheet
        visible={actionSheetConfig?.visible ?? false}
        onOpenChange={(visible) => {
          if (!visible) {
            setActionSheetConfig(null)
            return
          }

          setActionSheetConfig((prev) => (prev ? { ...prev, visible } : prev))
        }}
        type={actionSheetConfig?.type ?? "album"}
        id={actionSheetConfig?.id ?? ""}
        name={actionSheetConfig?.name ?? ""}
        subtitle={actionSheetConfig?.subtitle}
        image={actionSheetConfig?.image}
        images={actionSheetConfig?.images}
        trackCount={actionSheetConfig?.trackCount ?? 0}
      />
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isTrackSheetOpen}
        onClose={() => setIsTrackSheetOpen(false)}
      />
    </View>
  )
}
