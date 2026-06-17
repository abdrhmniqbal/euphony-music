/**
 * Purpose: Renders interactive search with input focus, recent searches, result tabs, and search-context playback.
 * Caller: Search tab route.
 * Dependencies: search queries/mutations, react-i18next, recent-search cache, player service, router navigation, reanimated entry transitions, theme colors.
 * Main Functions: SearchInteractionScreen()
 * Side Effects: Updates recent-search storage/cache for navigation results with consistent subtitles and playlist artwork grids, starts playback from search-result queues, and navigates to media detail routes.
 */

import { useLocalSearchParams, useNavigation } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Input, PressableFeedback } from "heroui-native"
import * as React from "react"
import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Keyboard, ScrollView, type TextInput, View } from "react-native"
import Animated, { FadeInUp, runOnJS } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"

import { RecentSearches, type RecentSearchItem } from "@/components/blocks/recent-searches"
import {
  type SearchAlbumResult,
  type SearchArtistResult,
  type SearchPlaylistResult,
  SearchResults,
  type SearchTab,
} from "@/components/blocks/search-results"
import LocalArrowLeftIcon from "@/components/icons/local/arrow-left"
import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import { Stack } from "@/layouts/stack"
import { queryClient } from "@/lib/tanstack-query"
import {
  resolveAlbumTransitionId,
  resolveArtistTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import { libraryKeys } from "@/modules/library/keys"
import {
  addRecentSearch,
  clearRecentSearches,
  deleteRecentSearch,
} from "@/modules/library/repository"
import { useThemeColors } from "@/modules/ui/theme"
import { useRecentSearches, useSearch } from "@/modules/library/queries"
import type { Track } from "@/modules/player/types"
import { playTrack } from "@/modules/player/service"

interface HeaderSearchInputProps {
  theme: ReturnType<typeof useThemeColors>
  initialValue: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onBack: () => void
  focusWhenReady: boolean
}

function HeaderSearchInput({
  theme,
  initialValue,
  onChangeText,
  onSubmit,
  onBack,
  focusWhenReady,
}: HeaderSearchInputProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(initialValue)
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
          <LocalArrowLeftIcon fill="none" width={24} height={24} color={theme.foreground} />
        </PressableFeedback>

        <Input
          ref={inputRef}
          placeholder={t("search.searchPlaceholder")}
          placeholderTextColor={theme.muted}
          value={inputValue}
          onChangeText={handleChangeText}
          onSubmitEditing={onSubmit}
          className="pl-12 pr-10"
          selectionColor={theme.accent}
          returnKeyType="search"
          autoFocus={focusWhenReady && initialValue.trim().length === 0}
        />
        {inputValue.length > 0 && (
          <PressableFeedback
            onPress={handleClear}
            className="absolute inset-y-0 right-2.5 justify-center p-1"
          >
            <LocalCancelCircleSolidIcon fill="none" width={20} height={20} color={theme.muted} />
          </PressableFeedback>
        )}
      </View>
    </View>
  )
}

export default function SearchInteractionScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const router = useRouter()
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>()

  const initialValue = initialQuery || ""
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>("All")
  const [headerInputKey, setHeaderInputKey] = useState(0)
  const [canAutoFocusInput, setCanAutoFocusInput] = useState(false)

  const { data: searchResults, isLoading, isFetching } = useSearch(searchQuery)
  const { data: recentSearches = [] } = useRecentSearches()
  const tracks = searchResults?.tracks ?? []
  const artists = searchResults?.artists ?? []
  const albums = searchResults?.albums ?? []
  const playlists = searchResults?.playlists ?? []

  const addRecentSearchMutation = useMutation(
    {
      mutationFn: addRecentSearch,
      onSuccess: async (nextRecentSearches) => {
        queryClient.setQueryData(libraryKeys.recentSearches(), nextRecentSearches)
      },
    },
    queryClient
  )

  const deleteRecentSearchMutation = useMutation(
    {
      mutationFn: deleteRecentSearch,
      onSuccess: async (nextRecentSearches) => {
        queryClient.setQueryData(libraryKeys.recentSearches(), nextRecentSearches)
      },
    },
    queryClient
  )

  const clearRecentSearchesMutation = useMutation(
    {
      mutationFn: clearRecentSearches,
      onSuccess: async () => {
        queryClient.setQueryData(libraryKeys.recentSearches(), [])
      },
    },
    queryClient
  )

  const isSearching = searchQuery.trim().length > 0

  function dismissKeyboard() {
    Keyboard.dismiss()
  }

  const handleBackNavigation = React.useCallback(() => {
    dismissKeyboard()
    if (navigation.canGoBack()) {
      router.back()
      return true
    }

    router.replace("/(main)/(search)")
    return true
  }, [navigation, router])

  function pushRecentSearch(item: {
    query: string
    title?: string
    subtitle?: string
    type?: RecentSearchItem["type"]
    targetId?: string
    image?: string
    images?: string[]
  }) {
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
      query,
      title: query,
      subtitle: t("navigation.tabs.search"),
    })
  }

  function handleClearRecentSearches() {
    dismissKeyboard()
    void clearRecentSearchesMutation.mutateAsync()
  }

  function handleRecentItemPress(item: RecentSearchItem) {
    dismissKeyboard()
    if (item.type === "artist" && item.query.trim()) {
      pushRecentSearch(item)
      router.push({
        pathname: "artist/[name]",
        params: { name: item.query },
      })
      return
    }

    if (item.type === "album" && item.query.trim()) {
      pushRecentSearch(item)
      router.push({
        pathname: "album/[name]",
        params: {
          name: item.query,
          transitionId: resolveAlbumTransitionId({
            id: item.targetId,
            title: item.title || item.query,
          }),
        },
      })
      return
    }

    if (item.type === "playlist" && item.targetId) {
      pushRecentSearch(item)
      router.push({
        pathname: "playlist/[id]",
        params: {
          id: item.targetId,
          transitionId: resolvePlaylistTransitionId({
            id: item.targetId,
            title: item.title,
          }),
        },
      })
      return
    }

    setSearchQuery(item.query || item.title)
    setHeaderInputKey((prev) => prev + 1)
    pushRecentSearch({
      query: item.query || item.title,
      title: item.title,
      subtitle: item.subtitle,
      type: item.type,
      targetId: item.targetId,
      image: item.image,
      images: item.images,
    })
  }

  function handleRemoveRecentItem(id: string) {
    dismissKeyboard()
    void deleteRecentSearchMutation.mutateAsync(id)
  }

  function handleTrackPress(track: Track) {
    dismissKeyboard()
    playTrack(track, tracks, {
      type: "search",
      title: t("navigation.tabs.search"),
    })
  }

  function handleArtistPress(artist: SearchArtistResult) {
    dismissKeyboard()
    pushRecentSearch({
      query: artist.name,
      title: artist.name,
      subtitle: t("library.count.track", { count: artist.trackCount }),
      type: "artist",
      targetId: artist.id,
      image: artist.image,
    })

    router.push({
      pathname: "artist/[name]",
      params: {
        name: artist.name,
        transitionId: resolveArtistTransitionId({
          id: artist.id,
          name: artist.name,
        }),
      },
    })
  }

  function handleAlbumPress(album: SearchAlbumResult) {
    dismissKeyboard()
    pushRecentSearch({
      query: album.title,
      title: album.title,
      subtitle: album.artist || t("library.favoriteType.album"),
      type: "album",
      targetId: album.id,
      image: album.image,
    })

    router.push({
      pathname: "album/[name]",
      params: {
        name: album.title,
        transitionId: resolveAlbumTransitionId({
          id: album.id,
          title: album.title,
        }),
      },
    })
  }

  function handlePlaylistPress(playlist: SearchPlaylistResult) {
    dismissKeyboard()
    pushRecentSearch({
      query: playlist.title,
      title: playlist.title,
      subtitle: t("library.count.track", { count: playlist.trackCount }),
      type: "playlist",
      targetId: playlist.id,
      image: playlist.image || playlist.images?.[0],
      images: playlist.images,
    })

    router.push({
      pathname: "playlist/[id]",
      params: {
        id: playlist.id,
        transitionId: resolvePlaylistTransitionId({
          id: playlist.id,
          title: playlist.title,
        }),
      },
    })
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Animated.View
        entering={FadeInUp.duration(220).withCallback((finished) => {
          if (finished) {
            runOnJS(setCanAutoFocusInput)(true)
          }
        })}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
        }}
      >
        <HeaderSearchInput
          key={`${headerInputKey}-${canAutoFocusInput ? "ready" : "pending"}`}
          theme={theme}
          initialValue={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSubmitSearch}
          onBack={handleBackNavigation}
          focusWhenReady={canAutoFocusInput}
        />
      </Animated.View>
      {isSearching ? (
        <SearchResults
          tracks={tracks}
          artists={artists}
          albums={albums}
          playlists={playlists}
          query={searchQuery}
          isLoading={isLoading || isFetching}
          activeTab={activeSearchTab}
          onActiveTabChange={setActiveSearchTab}
          onTrackPress={handleTrackPress}
          onArtistPress={handleArtistPress}
          onAlbumPress={handleAlbumPress}
          onPlaylistPress={handlePlaylistPress}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={dismissKeyboard}
        >
          <RecentSearches
            searches={recentSearches}
            onClear={handleClearRecentSearches}
            onItemPress={handleRecentItemPress}
            onRemoveItem={handleRemoveRecentItem}
          />
        </ScrollView>
      )}
    </View>
  )
}
