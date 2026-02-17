import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useStore } from "@nanostores/react"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { Input, PressableFeedback } from "heroui-native"
import { ScrollView, View, type TextInput } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import { $tracks } from "@/modules/player/player.store"
import { usePlaylists } from "@/modules/playlist/playlist.queries"
import LocalArrowLeftIcon from "@/components/icons/local/arrow-left"
import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import {
  RecentSearches,
  type RecentSearchItem,
} from "@/components/blocks/recent-searches"
import { SearchResults } from "@/components/blocks/search-results"

interface HeaderSearchInputProps {
  theme: ReturnType<typeof useThemeColors>
  initialValue: string
  onChangeText: (text: string) => void
  onBack: () => void
}

function HeaderSearchInput({
  theme,
  initialValue,
  onChangeText,
  onBack,
}: HeaderSearchInputProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const inputRef = useRef<TextInput>(null)
  const shouldAutoFocus = initialValue.trim().length === 0

  useEffect(() => {
    if (!shouldAutoFocus) {
      return
    }

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [shouldAutoFocus])

  function handleChangeText(text: string) {
    setInputValue(text)
    onChangeText(text)
  }

  function handleClear() {
    setInputValue("")
    onChangeText("")
  }

  return (
    <View className="flex-1">
      <View className="relative">
        <PressableFeedback
          onPress={onBack}
          className="absolute inset-y-0 left-2.5 z-10 justify-center p-1"
        >
          <LocalArrowLeftIcon
            fill="none"
            width={24}
            height={24}
            color={theme.foreground}
          />
        </PressableFeedback>
        <Input
          ref={inputRef}
          autoFocus={shouldAutoFocus}
          placeholder="Tracks, artists, albums..."
          placeholderTextColor={theme.muted}
          value={inputValue}
          onChangeText={handleChangeText}
          variant="secondary"
          className="pr-9 pl-12"
          selectionColor={theme.accent}
          returnKeyType="search"
        />
        {inputValue.length > 0 && (
          <PressableFeedback
            onPress={handleClear}
            className="absolute inset-y-0 right-2.5 justify-center p-1"
          >
            <LocalCancelCircleSolidIcon
              fill="none"
              width={20}
              height={20}
              color={theme.muted}
            />
          </PressableFeedback>
        )}
      </View>
    </View>
  )
}

export default function SearchInteractionScreen() {
  const theme = useThemeColors()
  const navigation = useNavigation()
  const router = useRouter()
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>()
  const tracks = useStore($tracks)
  const { data: playlists = [] } = usePlaylists()

  const initialValue = initialQuery || ""
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [headerInputKey, setHeaderInputKey] = useState(0)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])

  const isSearching = searchQuery.trim().length > 0

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setHeaderInputKey((prev) => prev + 1)
    })

    return unsubscribe
  }, [navigation])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Search",
      headerTitle: () => (
        <HeaderSearchInput
          key={headerInputKey}
          theme={theme}
          initialValue={searchQuery}
          onChangeText={setSearchQuery}
          onBack={() => router.back()}
        />
      ),
      headerBackVisible: false,
      headerLeft: () => null,
      headerStyle: {
        backgroundColor: theme.background,
      },
      headerShadowVisible: false,
    })
  }, [navigation, theme, router, searchQuery, headerInputKey])

  function handleClearRecentSearches() {
    setRecentSearches([])
  }

  function handleRecentItemPress(item: RecentSearchItem) {
    setSearchQuery(item.title)
    setHeaderInputKey((prev) => prev + 1)
  }

  function handleRemoveRecentItem(id: string) {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        {isSearching ? (
          <SearchResults
            tracks={tracks}
            playlists={playlists}
            query={searchQuery}
            onArtistPress={(artist) =>
              router.push({
                pathname: "/(main)/(library)/artist/[name]",
                params: {
                  name: artist.name,
                  from: "search",
                  query: searchQuery,
                },
              })
            }
            onAlbumPress={(album) =>
              router.push({
                pathname: "/(main)/(library)/album/[name]",
                params: {
                  name: album.title,
                  from: "search",
                  query: searchQuery,
                },
              })
            }
            onPlaylistPress={(playlist) =>
              router.push({
                pathname: "/(main)/(library)/playlist/[id]",
                params: {
                  id: playlist.id,
                  from: "search",
                  query: searchQuery,
                },
              })
            }
          />
        ) : (
          <RecentSearches
            searches={recentSearches}
            onClear={handleClearRecentSearches}
            onItemPress={handleRecentItemPress}
            onRemoveItem={handleRemoveRecentItem}
          />
        )}
      </ScrollView>
    </View>
  )
}
