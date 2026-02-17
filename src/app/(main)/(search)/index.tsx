import * as React from "react"
import { useStore } from "@nanostores/react"
import { useRouter } from "expo-router"
import { Input, PressableFeedback } from "heroui-native"
import { RefreshControl, ScrollView, Text, View } from "react-native"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import type { GenreCategory as Category } from "@/modules/genres/genres.utils"
import { $indexerState } from "@/modules/indexer"
import { useSearchScreen } from "@/modules/search/hooks/use-search-screen"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalSearchIcon from "@/components/icons/local/search"
import { GenreCard } from "@/components/patterns"
import { EmptyState } from "@/components/ui"

export default function SearchScreen() {
  const theme = useThemeColors()
  const router = useRouter()
  const indexerState = useStore($indexerState)
  const { categories, refresh } = useSearchScreen()

  function handleGenrePress(genre: Category) {
    router.push(`./genre/${encodeURIComponent(genre.title)}`)
  }

  function handleSearchPress() {
    router.push("/search-interaction")
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
      <View className="relative mb-6">
        <View className="absolute top-1/2 left-4 z-10 -translate-y-1/2">
          <LocalSearchIcon
            fill="none"
            width={24}
            height={24}
            color={theme.muted}
          />
        </View>
        <Input
          value=""
          editable={false}
          showSoftInputOnFocus={false}
          placeholder="Search for tracks, artists, albums..."
          className="pl-12"
        />
        <PressableFeedback
          onPress={handleSearchPress}
          className="absolute inset-0 z-20"
          accessibilityRole="button"
          accessibilityLabel="Open search"
        />
      </View>

      <Text className="mb-4 text-xl font-bold text-foreground">
        Browse by Genre
      </Text>

      {categories.length > 0 ? (
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {categories.map((genre) => (
            <GenreCard
              key={genre.id}
              title={genre.title}
              color={genre.color}
              pattern={genre.pattern}
              onPress={() => handleGenrePress(genre)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={
            <LocalMusicNoteSolidIcon
              fill="none"
              width={48}
              height={48}
              color={theme.muted}
            />
          }
          title="No genres found"
          message="Start playing music to see genres here!"
          className="mt-8"
        />
      )}
    </ScrollView>
  )
}
