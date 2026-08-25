import { useLocalSearchParams, Stack } from "expo-router"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useThemeColor } from "heroui-native"

import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { AlbumGrid, type Album } from "@/components/blocks/album-grid"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { useGuardedRouter } from "@/core/navigation"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { startIndexing } from "@/domains/indexer/service"
import { refreshIndexedMediaState } from "@/domains/indexer/utils/refresh"
import { useGenreDetails } from "@/domains/genres/queries"
import { ALBUM_SORT_OPTIONS, resolveSortLabel } from "@/domains/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import {
  sortAlbums,
  type DetailSortConfig,
  type DetailSortField,
} from "@/domains/tracks/detail-sort"

export function GenreAlbumsScreen() {
  const { t } = useTranslation()
  const { name } = useLocalSearchParams<{ name: string }>()
  const muted = useThemeColor("muted")
  const router = useGuardedRouter()
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)

  const genreName = React.useMemo(() => {
    try {
      return decodeURIComponent(name ?? "").trim()
    } catch {
      return (name ?? "").trim()
    }
  }, [name])

  const { data, isLoading, isFetching, refetch } = useGenreDetails(genreName)

  const sortConfig: DetailSortConfig = allSortConfigs.GenreAlbums ?? {
    field: "year",
    order: "desc",
  }
  const albums = React.useMemo(() => data?.albums ?? [], [data?.albums])
  const sortedAlbums = React.useMemo(
    () =>
      sortAlbums(
        albums.map(
          (album): Album => ({
            id: album.id ?? album.name,
            title: album.name,
            artist: album.artist ?? t("library.unknownArtist"),
            image: album.image ?? undefined,
            trackCount: album.trackCount,
            year: album.year ?? 0,
            dateAdded: 0,
          })
        ),
        sortConfig
      ),
    [albums, sortConfig, t]
  )
  const autoHideScrollProps = useAutoHideHeaderScroll()

  function handleSortSelect(field: DetailSortField, order?: "asc" | "desc") {
    setSortConfig("GenreAlbums", field, order)
  }

  async function refresh() {
    await startIndexing(false, false)
    await refreshIndexedMediaState()
    await refetch()
  }

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{ title: t("library.genreAlbumsTitle", { genre: genreName }) }}
        />
        <AlbumGrid
          data={sortedAlbums}
          onAlbumPress={(album) =>
            router.push({ pathname: "/album/[name]", params: { name: album.title } })
          }
          contentContainerStyle={{ paddingBottom: 200 }}
          {...autoHideScrollProps}
          refreshControl={
            <ThemedRefreshControl
              refreshing={isLoading || isFetching}
              onRefresh={() => void refresh()}
            />
          }
          listHeader={
            <View className="mb-4 flex-row items-center justify-between px-4 pt-4">
              <Text className="text-lg font-bold text-foreground">
                {t("library.count.track", { count: sortedAlbums.length })}
              </Text>
              <SortSheet.Trigger
                label={
                  t(resolveSortLabel(ALBUM_SORT_OPTIONS, sortConfig.field) || "library.sortBy")
                }
                iconSize={14}
              />
            </View>
          }
        />
        {sortedAlbums.length === 0 ? (
          <View className="px-4">
            <EmptyState
              icon={<LocalVynil02SolidIcon fill="none" width={48} height={48} color={muted} />}
              title={t("library.empty.albumsFoundTitle")}
              message={t("library.genreAlbumsUnavailable", { genre: genreName })}
            />
          </View>
        ) : null}
        <SortSheet.Content options={ALBUM_SORT_OPTIONS} />
      </View>
    </SortSheet>
  )
}
