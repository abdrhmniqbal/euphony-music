import { Image } from "expo-image"
import { useLocalSearchParams, Stack } from "expo-router"
import { Button } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import Animated from "react-native-reanimated"

import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import { BackButton } from "@/components/patterns/back-button"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { screenEnterTransition } from "@/lib/animations"
import { mergeText } from "@/lib/merge-text"
import { resolveAlbumTransitionId } from "@/lib/transition-ids"
import { formatAlbumDuration } from "@/domains/albums/utils"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import { useIsFavorite } from "@/domains/favorites/queries"
import {
  ALBUM_TRACK_SORT_OPTIONS,
  resolveSortLabel,
} from "@/domains/library/sort-constants"
import type { DetailSortConfig, DetailSortField } from "@/domains/tracks/detail-sort"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import { sortPlayerTracks } from "@/domains/tracks/detail-sort"
import { useTracks } from "@/domains/tracks/queries"
import { getPreferenceState } from "@/core/preferences/store"
import { handleScroll } from "@/core/ui/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import { playTrack } from "@/playback/service"
import { usePlaybackActions, decodeRouteParam } from "@/domains/library/detail-actions"

const HEADER_COLLAPSE_THRESHOLD = 120

export function AlbumDetailScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const { name, transitionId } = useLocalSearchParams<{
    name: string
    transitionId?: string
  }>()
  const toggleFavoriteMutation = useToggleFavorite()
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const parsedAlbumRouteName = React.useMemo(() => decodeRouteParam(name), [name])
  const albumName = parsedAlbumRouteName.value
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const normalizedAlbumName = albumName.trim().toLowerCase()
  const { data: dbTracks = [], isLoading: isAlbumTracksLoading } = useTracks()

  const albumTracks = React.useMemo(
    () =>
      dbTracks
        .filter((track) => (track.albumName || "").trim().toLowerCase() === normalizedAlbumName)
        .map((track) => toPlayerTrack(track, splitConfig)!)
        .filter(Boolean) as PlayerTrack[],
    [dbTracks, normalizedAlbumName, splitConfig]
  )

  const albumInfo =
    albumTracks.length > 0
      ? {
          title: albumTracks[0].album || t("library.unknownAlbum"),
          artist: albumTracks[0].albumArtist || albumTracks[0].artist || t("library.unknownArtist"),
          image: albumTracks[0].albumArtwork || albumTracks[0].image,
          year: albumTracks[0].year,
        }
      : null
  const totalDuration = albumTracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  const sortConfig: DetailSortConfig = allSortConfigs.AlbumTracks ?? {
    field: "trackNumber",
    order: "asc",
  }
  const sortedTracks = sortPlayerTracks(albumTracks, sortConfig)
  const albumId = albumTracks[0]?.albumId
  const albumTransitionId = resolveAlbumTransitionId({
    transitionId,
    id: albumId,
    title: albumInfo?.title || albumName,
  })
  const { data: isAlbumFavorite = false } = useIsFavorite("album", albumId ?? "")
  const isLoading = isAlbumTracksLoading && albumTracks.length === 0
  const totalDurationLabel = formatAlbumDuration(totalDuration)
  const hasMultipleDiscs = new Set(sortedTracks.map((track) => track.discNumber || 1)).size > 1

  function handleSortSelect(field: (typeof ALBUM_TRACK_SORT_OPTIONS)[number]["field"], order?: "asc" | "desc") {
    setSortConfig("AlbumTracks", field, order)
  }

  if (!albumInfo) {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ScaleLoader size={22} />
        </View>
      )
    }

    return (
      <EmptyState
        icon={<LocalVynil02SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
        title={t("library.empty.albumsFoundTitle")}
        message={t("library.empty.albumsFoundTitle")}
        className="mt-12"
      />
    )
  }

  const activeAlbumInfo = albumInfo

  function playSelectedTrack(track: PlayerTrack) {
    void playTrack(track, sortedTracks, { type: "album", title: activeAlbumInfo.title })
  }

  const { playAll: playAllTracks, shuffle: shuffleTracks } = usePlaybackActions(
    sortedTracks,
    activeAlbumInfo.title,
    "album"
  )

  function getSortLabel() {
    return t(resolveSortLabel(ALBUM_TRACK_SORT_OPTIONS, sortConfig.field, t) || "library.sortBy")
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
            title: showHeaderTitle ? albumInfo.title : "",
            headerBackVisible: false,
            headerLeft: () => <BackButton className="-ml-2" />,
            headerRight: () =>
              albumId ? (
                <View className="-mr-2 flex-row gap-4">
                  <Button
                    onPress={() => {
                      if (!albumId) {
                        return
                      }

                      void toggleFavoriteMutation.mutateAsync({
                        type: "album",
                        itemId: albumId,
                        isCurrentlyFavorite: isAlbumFavorite,
                        name: albumInfo.title,
                        subtitle: albumInfo.artist,
                        image: albumInfo.image,
                      })
                    }}
                    isDisabled={toggleFavoriteMutation.isPending}
                    variant="ghost"
                    className="-mr-2"
                    isIconOnly
                  >
                    {isAlbumFavorite ? (
                      <LocalFavouriteSolidIcon fill="none" width={24} height={24} color={theme.danger} />
                    ) : (
                      <LocalFavouriteIcon fill="none" width={24} height={24} color={theme.foreground} />
                    )}
                  </Button>
                  <Button variant="ghost" isIconOnly onPress={() => setShowActionSheet(true)}>
                    <LocalMoreHorizontalCircle01SolidIcon fill="none" width={24} height={24} color={theme.foreground} />
                  </Button>
                </View>
              ) : null,
          }}
        />
        <TrackList
          data={sortedTracks}
          showNumbers
          hideCover
          hideArtist
          queueContext={{ type: "album", title: activeAlbumInfo.title }}
          getNumber={(track, index) => track.trackNumber || index + 1}
          renderItemPrefix={(track, index, tracks) => {
            if (sortConfig.field !== "trackNumber" || !hasMultipleDiscs) {
              return null
            }

            const currentDisc = track.discNumber || 1
            const previousDisc = tracks[index - 1]?.discNumber || 1
            const shouldShowDiscSeparator = index === 0 || currentDisc !== previousDisc

            if (!shouldShowDiscSeparator) {
              return null
            }

            return (
              <View className="pt-3 pb-1">
                <Text className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Disc {currentDisc}
                </Text>
              </View>
            )
          }}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(event) => {
            handleScroll()
            const y = event.nativeEvent.contentOffset.y
            const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
            if (nextShowHeaderTitle !== showHeaderTitle) {
              setShowHeaderTitle(nextShowHeaderTitle)
            }
          }}
          listHeader={
            <>
              <View className="pt-6 pb-6">
                <View className="flex-row gap-4">
                  <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                    {albumInfo.image ? (
                      <Image source={{ uri: albumInfo.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <LocalVynil02SolidIcon fill="none" width={48} height={48} color={theme.muted} />
                      </View>
                    )}
                  </View>

                  <View className="flex-1 justify-center">
                    <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
                      {albumInfo.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted" numberOfLines={1}>
                      {albumInfo.artist}
                    </Text>
                    <Text className="mt-2 text-sm text-muted">{mergeText([albumInfo?.year, totalDurationLabel])}</Text>
                  </View>
                </View>
              </View>

              <Animated.View entering={screenEnterTransition()}>
                <PlaybackActionsRow onPlay={playAllTracks} onShuffle={shuffleTracks} className="mb-4" />
              </Animated.View>

              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  {t("library.count.track", { count: sortedTracks.length })}
                </Text>
                <SortSheet.Trigger label={getSortLabel()} iconSize={16} />
              </View>
            </>
          }
        />

        {albumId ? (
          <CollectionActionSheet
            visible={showActionSheet}
            onOpenChange={setShowActionSheet}
            type="album"
            id={albumId}
            favoriteId={albumId}
            name={albumInfo.title}
            subtitle={albumInfo.artist}
            image={albumInfo.image}
            trackCount={sortedTracks.length}
          />
        ) : null}
        <SortSheet.Content options={ALBUM_TRACK_SORT_OPTIONS} />
      </View>
    </SortSheet>
  )
}
