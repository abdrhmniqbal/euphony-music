/**
 * Purpose: Renders the Genre detail route with top-track previews and recommended albums.
 * Caller: Genre detail sub-route in the Library stack.
 * Dependencies: genre detail query, player service, album transition helper, themed refresh control, theme colors.
 * Main Functions: GenreDetailsScreen()
 * Side Effects: Starts indexing on refresh, starts playback, and updates scroll state.
 */

import type { GenreAlbumInfo } from "@/modules/search/types"
import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation"
import { useMemo, useState } from "react"

import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "heroui-native"
import Animated from "react-native-reanimated"
import { CollectionActionSheet } from "@/modules/library/ui/collection-action-sheet"
import { ContentSection } from "@/modules/library/ui/content-section"
import { MediaCarousel } from "@/modules/library/ui/media-carousel"
import { RankedTrackCarousel } from "@/modules/tracks/ui/ranked-track-carousel"
import LocalMusicNote04SolidIcon from "@/modules/shared/components/icons/local/music-note-04-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/modules/shared/components/icons/local/more-horizontal-circle-01-solid"
import LocalVynil02SolidIcon from "@/modules/shared/components/icons/local/vynil-02-solid"
import { MusicCard } from "@/modules/library/ui/music-card"
import { screenEnterTransition } from "@/modules/shared/constants/animations"
import { Stack } from "@/modules/shared/layouts/stack"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/progress/store"
import { scheduleRouteWarning } from "@/modules/navigation"
import { playTrack } from "@/modules/player/service"
import { useGenreDetails } from "@/modules/search/queries"
import { getPreviewAlbums } from "@/modules/search/utils"
import { ThemedRefreshControl } from "@/modules/shared/components/ui/themed-refresh-control"
import { getSafeRouteName } from "@/modules/navigation"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"
import { createPlaybackQueueContext } from "@/stores/playback/types"

const CHUNK_SIZE = 5
const TOP_TRACKS_PREVIEW_LIMIT = 25

export default function GenreDetailsScreen() {
  const { t } = useTranslation()
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<GenreAlbumInfo | null>(null)
  const [showAlbumSheet, setShowAlbumSheet] = useState(false)
  const { name } = useLocalSearchParams<{ name: string }>()
  const router = useRouter()
  const theme = useThemeColors()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)

  const parsedGenreRouteName = useMemo(() => getSafeRouteName(name), [name])
  const genreName = parsedGenreRouteName.value

  scheduleRouteWarning({
    key: "genre-details:missing-name",
    message: "Genre details route missing name param",
    metadata: { route: "/genre/[name]" },
    enabled: !genreName.trim(),
  })
  scheduleRouteWarning({
    key: `genre-details:decode-failed:${parsedGenreRouteName.raw}`,
    message: "Genre details route name decode failed",
    metadata: {
      route: "/genre/[name]",
      rawName: parsedGenreRouteName.raw,
    },
    enabled: parsedGenreRouteName.decodeFailed,
  })

  const { data, isLoading, isFetching, refetch } = useGenreDetails(genreName)
  const topTracks = data?.topTracks ?? []
  const albums = data?.albums ?? []
  const previewTopTracks = topTracks.slice(0, TOP_TRACKS_PREVIEW_LIMIT)
  const previewAlbums = getPreviewAlbums(albums)

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  const openAlbumSheet = (album: GenreAlbumInfo) => {
    setSelectedAlbum(album)
    setShowAlbumSheet(true)
  }

  function renderAlbumItem(album: GenreAlbumInfo) {
    const subtitle = `${album.artist || t("library.unknownArtist")} · ${t("library.count.track", {
      count: album.trackCount,
    })}`

    return (
      <MusicCard
        title={album.name}
        subtitle={subtitle}
        image={album.image}
        icon={<LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
        onPress={() =>
          router.push({
            pathname: "/album/[name]",
            params: {
              name: album.name,
              transitionId: resolveAlbumTransitionId({
                title: album.name,
              }),
            },
          })
        }
        onLongPress={() => openAlbumSheet(album)}
      />
    )
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: genreName,
          headerRight: () => (
            <Button
              variant="ghost"
              className="-mr-2"
              isIconOnly
              onPress={() => setShowActionSheet(true)}
            >
              <LocalMoreHorizontalCircle01SolidIcon
                fill="none"
                width={24}
                height={24}
                color={theme.foreground}
              />
            </Button>
          ),
        }}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        {...autoHideScrollProps}
        refreshControl={
          <ThemedRefreshControl
            refreshing={isIndexing || isLoading || isFetching}
            onRefresh={refresh}
          />
        }
      >
        <Animated.View entering={screenEnterTransition()}>
          <ContentSection
            title={t("home.topTracks")}
            data={previewTopTracks}
            onViewMore={() =>
              router.push({
                pathname: "./top-tracks",
                params: { name: genreName },
              })
            }
            emptyState={{
              icon: (
                <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
              ),
              title: t("home.empty.topTracksTitle"),
              message: t("library.genreTopTracksMessage", {
                genre: genreName,
              }),
            }}
            renderContent={(data) => (
              <RankedTrackCarousel
                data={data}
                chunkSize={CHUNK_SIZE}
                onItemPress={(track) =>
                  playTrack(track, topTracks, {
                    type: "genre",
                    title: genreName,
                  })
                }
                queueContext={createPlaybackQueueContext("genre", genreName)}
              />
            )}
          />
        </Animated.View>

        <Animated.View entering={screenEnterTransition()}>
          <ContentSection
            title={t("library.recommendedAlbums")}
            data={previewAlbums}
            onViewMore={() => router.push({ pathname: "./albums", params: { name: genreName } })}
            emptyState={{
              icon: (
                <LocalVynil02SolidIcon fill="none" width={48} height={48} color={theme.muted} />
              ),
              title: t("library.empty.albumsFoundTitle"),
              message: t("library.genreAlbumsUnavailable", {
                genre: genreName,
              }),
            }}
            renderContent={(data) => (
              <MediaCarousel
                data={data}
                renderItem={renderAlbumItem}
                keyExtractor={(album, index) => `${album.name}-${index}`}
              />
            )}
          />
        </Animated.View>
      </ScrollView>

      <CollectionActionSheet
        visible={showActionSheet}
        onOpenChange={setShowActionSheet}
        type="genre"
        id={genreName}
        name={genreName}
        subtitle={t("library.genre")}
        trackCount={data?.topTracks?.length || 0}
        hideFavoriteAction
      />
      <CollectionActionSheet
        visible={showAlbumSheet && Boolean(selectedAlbum)}
        onOpenChange={(open) => {
          if (!open) {
            setShowAlbumSheet(false)
          }
        }}
        type="album"
        id={selectedAlbum?.name ?? ""}
        name={selectedAlbum?.name ?? ""}
        subtitle={selectedAlbum?.artist}
        image={selectedAlbum?.image}
        trackCount={selectedAlbum?.trackCount ?? 0}
      />
    </View>
  )
}
