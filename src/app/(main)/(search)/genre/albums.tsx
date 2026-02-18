import { useState } from "react"
import { useStore } from "@nanostores/react"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { RefreshControl, Text, View } from "react-native"
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { useGenreAlbumsScreen } from "@/modules/genres/hooks/use-genre-albums-screen"
import { $indexerState } from "@/modules/indexer"
import {
  ALBUM_SORT_OPTIONS,
  sortAlbums,
  type AlbumSortField,
  type SortOrder,
} from "@/modules/library/library-sort.store"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { AlbumGrid, type Album } from "@/components/blocks/album-grid"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { EmptyState } from "@/components/ui"

export default function GenreAlbumsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const router = useRouter()
  const indexerState = useStore($indexerState)
  const theme = useThemeColors()
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    field: AlbumSortField
    order: SortOrder
  }>({
    field: "year",
    order: "desc",
  })

  const genreName = decodeURIComponent(name || "")
  const { albumData, isLoading, refresh } = useGenreAlbumsScreen(genreName)
  const sortedAlbumData = sortAlbums(albumData, sortConfig) as Album[]

  function handleAlbumPress(album: Album) {
    router.push(`/(main)/(library)/album/${encodeURIComponent(album.title)}`)
  }

  function handleSortSelect(field: AlbumSortField, order?: SortOrder) {
    setSortConfig((current) => {
      const nextOrder =
        order ||
        (current.field === field
          ? current.order === "asc"
            ? "desc"
            : "asc"
          : "asc")
      return { field, order: nextOrder }
    })
    setSortModalVisible(false)
  }

  function getSortLabel() {
    const selected = ALBUM_SORT_OPTIONS.find(
      (option) => option.field === sortConfig.field
    )
    return selected?.label || "Sort"
  }

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={setSortModalVisible}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: `${genreName.trim()} Albums`,
          }}
        />

        {sortedAlbumData.length === 0 ? (
          <Animated.View
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(300)}
            className="px-6 py-4"
          >
            <EmptyState
              icon={
                <LocalVynilSolidIcon
                  fill="none"
                  width={48}
                  height={48}
                  color={theme.muted}
                />
              }
              title="No albums found"
              message={`No albums available in ${genreName}`}
              className="mt-12"
            />
          </Animated.View>
        ) : (
          <AlbumGrid
            data={sortedAlbumData}
            onAlbumPress={handleAlbumPress}
            contentContainerStyle={{ paddingBottom: 200 }}
            onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            refreshControl={
              <RefreshControl
                refreshing={indexerState.isIndexing || isLoading}
                onRefresh={refresh}
                tintColor={theme.accent}
              />
            }
            listHeader={
              <Animated.View
                entering={FadeInRight.duration(300)}
                exiting={FadeOutLeft.duration(300)}
                className="px-6 py-4"
              >
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-foreground">
                    {sortedAlbumData.length} Albums
                  </Text>
                  <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                </View>
              </Animated.View>
            }
          />
        )}

        <SortSheet.Content options={ALBUM_SORT_OPTIONS} />
      </View>
    </SortSheet>
  )
}
