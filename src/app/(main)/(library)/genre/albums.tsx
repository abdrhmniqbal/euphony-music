/**
 * Purpose: Renders the Genre Albums detail route.
 * Caller: Genre detail sub-route in the Library stack.
 * Dependencies: genre albums query, album grid, themed refresh control, theme colors.
 * Main Functions: GenreAlbumsScreen()
 * Side Effects: Starts indexing on refresh and updates local sort state.
 */

import type { AlbumSortField, SortOrder } from "@/modules/library/sort-types"
import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import Animated from "react-native-reanimated"
import { type Album, AlbumGrid } from "@/modules/library/ui/album-grid"
import { SortSheet } from "@/modules/library/ui/sort-sheet"
import LocalVynil02SolidIcon from "@/modules/shared/components/icons/local/vynil-02-solid"
import { EmptyState } from "@/modules/shared/components/ui/empty-state"
import { ThemedRefreshControl } from "@/modules/shared/components/ui/themed-refresh-control"
import { screenEnterTransition, screenExitTransition } from "@/modules/shared/constants/animations"
import { Stack } from "@/modules/shared/layouts/stack"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/progress/store"
import { ALBUM_SORT_OPTIONS } from "@/modules/library/sort-constants"
import { sortAlbums } from "@/modules/library/sort-utils"
import { scheduleRouteWarning } from "@/modules/navigation/route-warning-runtime"
import { useGenreAlbums } from "@/modules/search/queries"
import { mapAlbumsToGridData } from "@/modules/search/utils"
import { getSafeRouteName } from "@/modules/navigation/route-params"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

export default function GenreAlbumsScreen() {
  const { t } = useTranslation()
  const { name } = useLocalSearchParams<{ name: string }>()
  const router = useRouter()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const theme = useThemeColors()
  const [sortModalVisible, setSortModalVisible] = useState(false)

  const [sortConfig, setSortConfig] = useState<{
    field: AlbumSortField
    order: SortOrder
  }>({
    field: "year",
    order: "desc",
  })

  const parsedGenreRouteName = useMemo(() => getSafeRouteName(name), [name])
  const genreName = parsedGenreRouteName.value
  const normalizedGenreName = genreName.trim()

  scheduleRouteWarning({
    key: "genre-albums:missing-name",
    message: "Genre albums route missing name param",
    metadata: { route: "/genre/albums" },
    enabled: !normalizedGenreName,
  })
  scheduleRouteWarning({
    key: `genre-albums:decode-failed:${parsedGenreRouteName.raw}`,
    message: "Genre albums route name decode failed",
    metadata: {
      route: "/genre/albums",
      rawName: parsedGenreRouteName.raw,
    },
    enabled: parsedGenreRouteName.decodeFailed,
  })

  const { data, isLoading, isFetching, refetch } = useGenreAlbums(normalizedGenreName)
  const albumData = mapAlbumsToGridData(data ?? [])
  const sortedAlbumData = sortAlbums(albumData, sortConfig)

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function handleAlbumPress(album: Album) {
    router.push({
      pathname: "/album/[name]",
      params: {
        name: album.title,
        transitionId: resolveAlbumTransitionId({
          id: album.id,
          title: album.title,
        }),
      },
    })
  }

  function handleSortSelect(field: AlbumSortField, order?: SortOrder) {
    setSortConfig((current) => {
      const nextOrder =
        order || (current.field === field ? (current.order === "asc" ? "desc" : "asc") : "asc")
      return { field, order: nextOrder }
    })
    setSortModalVisible(false)
  }

  function getSortLabel() {
    const selected = ALBUM_SORT_OPTIONS.find((option) => option.field === sortConfig.field)
    return selected ? t(selected.label) : t("library.sort")
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

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
            title: t("library.genreAlbumsTitle", {
              genre: genreName.trim(),
            }),
          }}
        />

        {sortedAlbumData.length === 0 ? (
          <Animated.View
            entering={screenEnterTransition()}
            exiting={screenExitTransition()}
            className="px-6 py-4"
          >
            <EmptyState
              icon={
                <LocalVynil02SolidIcon fill="none" width={48} height={48} color={theme.muted} />
              }
              title={t("library.empty.albumsFoundTitle")}
              message={t("library.genreAlbumsUnavailable", {
                genre: genreName,
              })}
              className="mt-12"
            />
          </Animated.View>
        ) : (
          <AlbumGrid
            data={sortedAlbumData}
            onAlbumPress={handleAlbumPress}
            resetScrollKey={`${genreName}-${sortConfig.field}-${sortConfig.order}`}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 200,
            }}
            {...autoHideScrollProps}
            refreshControl={
              <ThemedRefreshControl
                refreshing={isIndexing || isLoading || isFetching}
                onRefresh={refresh}
              />
            }
            listHeader={
              <Animated.View
                entering={screenEnterTransition()}
                exiting={screenExitTransition()}
                className="py-4"
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
