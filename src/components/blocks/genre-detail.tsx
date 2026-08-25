import { useLocalSearchParams, Stack } from "expo-router"
import * as React from "react"
import { useMemo, useState } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button, useThemeColor } from "heroui-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { AlbumGrid, type Album } from "@/components/blocks/album-grid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { ContentSection } from "@/components/blocks/content-section"
import { RankedTrackCarousel } from "@/components/blocks/ranked-track-carousel"
import { BackButton } from "@/components/patterns/back-button"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { SCREEN_SECTION_TOP_SPACING } from "@/lib/layout"
import { useGuardedRouter } from "@/core/navigation"
import { getPreferenceState } from "@/core/preferences/store"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { startIndexing } from "@/domains/indexer/service"
import { refreshIndexedMediaState } from "@/domains/indexer/utils/refresh"
import { useGenreDetails } from "@/domains/genres/queries"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import { createPlaybackQueueContext } from "@/playback/types"

const CHUNK_SIZE = 5
const TOP_TRACKS_PREVIEW_LIMIT = 25
const ALBUMS_PREVIEW_LIMIT = 8

export function GenreDetailScreen() {
  const { t } = useTranslation()
  const [showActionSheet, setShowActionSheet] = useState(false)
  const { name } = useLocalSearchParams<{ name: string }>()
  const [muted, foreground] = useThemeColor(["muted", "foreground"])
  const router = useGuardedRouter()
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const genreName = useMemo(() => {
    try {
      return decodeURIComponent(name ?? "").trim()
    } catch {
      return (name ?? "").trim()
    }
  }, [name])

  const { data, isLoading, isFetching, refetch } = useGenreDetails(genreName)

  const topTracks = useMemo(
    () =>
      (data?.topTracks ?? [])
        .map((row): PlayerTrack | null =>
          toPlayerTrack(
          {
            id: row.id,
            name: row.title,
            artists: row.artistName ? [row.artistName] : null,
            artwork: row.artwork,
            albumId: row.albumId,
            uri: "",
            duration: row.duration,
            discoverTime: row.dateAdded,
            modificationTime: null,
            rawArtistName: row.rawArtist,
            albumName: row.albumTitle,
            artistName: row.artistName,
          },
          splitConfig
        )
        )
        .filter((track): track is PlayerTrack => track !== null),
    [data?.topTracks, splitConfig]
  )

  function toAlbumItems(albums: NonNullable<typeof data>["albums"]): Album[] {
    return albums.map((album) => ({
      id: album.id ?? album.name,
      title: album.name,
      artist: album.artist ?? t("library.unknownArtist"),
      image: album.image ?? undefined,
      trackCount: album.trackCount,
      year: album.year ?? 0,
      dateAdded: 0,
    }))
  }

  const previewTopTracks = topTracks.slice(0, TOP_TRACKS_PREVIEW_LIMIT)
  const previewAlbumItems = toAlbumItems(data?.albums ?? []).slice(0, ALBUMS_PREVIEW_LIMIT)
  const queueContext = createPlaybackQueueContext("genre", genreName)
  const autoHideScrollProps = useAutoHideHeaderScroll()

  async function refresh() {
    await startIndexing(false, false)
    await refreshIndexedMediaState()
    await refetch()
  }

  function openAlbum(album: Album) {
    router.push({ pathname: "/album/[name]", params: { name: album.title } })
  }

  if (!genreName) {
    return (
      <View className="flex-1 bg-background" />
    )
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: genreName,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
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
                color={foreground}
              />
            </Button>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 220,
          paddingTop: SCREEN_SECTION_TOP_SPACING,
        }}
        {...autoHideScrollProps}
        refreshControl={
          <ThemedRefreshControl
            refreshing={isLoading || isFetching}
            onRefresh={() => void refresh()}
          />
        }
      >
        <ContentSection
          title={t("home.topTracks")}
          data={previewTopTracks}
          onViewMore={() => router.push("/(main)/(library)/genre/top-tracks")}
          emptyState={{
            icon: (
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />
            ),
            title: t("home.empty.topTracksTitle"),
            message: t("library.genreTopTracksMessage", { genre: genreName }),
          }}
          renderContent={(sectionData) => (
            <RankedTrackCarousel
              data={sectionData}
              chunkSize={CHUNK_SIZE}
              queueContext={queueContext}
            />
          )}
        />

        <ContentSection
          title={t("library.recommendedAlbums")}
          data={previewAlbumItems}
          onViewMore={() => router.push("/(main)/(library)/genre/albums")}
          emptyState={{
            icon: <LocalVynil02SolidIcon fill="none" width={48} height={48} color={muted} />,
            title: t("library.empty.albumsFoundTitle"),
            message: t("library.genreAlbumsUnavailable", { genre: genreName }),
          }}
          renderContent={(albums) => (
            <AlbumGrid horizontal data={albums} onAlbumPress={openAlbum} />
          )}
        />
      </ScrollView>

      <CollectionActionSheet
        visible={showActionSheet}
        onOpenChange={setShowActionSheet}
        type="genre"
        id={genreName}
        name={genreName}
        subtitle={t("library.genre")}
        trackCount={topTracks.length}
        hideFavoriteAction
      />
    </View>
  )
}
