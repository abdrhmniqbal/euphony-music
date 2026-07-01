import type { AlbumTrackSortField } from "@/modules/library/sort-types"
import type { Track } from "@/modules/player/store"
import { Image } from "expo-image"
import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button } from "heroui-native"
import * as React from "react"
import { useState } from "react"

import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import Animated from "react-native-reanimated"
import { CollectionActionSheet } from "@/components/blocks/sheets/collection-action-sheet"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sheets/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { BackButton } from "@/components/patterns/back-button"
import { EmptyState } from "@/components/ui/empty-state"
import { screenEnterTransition } from "@/constants/animations"
import { DETAIL_HEADER_BOTTOM_SPACING, SCREEN_SECTION_TOP_SPACING } from "@/constants/layout"
import { Stack } from "@/layouts/stack"
import { formatAlbumDuration } from "@/modules/albums/utils"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { ALBUM_TRACK_SORT_OPTIONS } from "@/modules/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/modules/library/sort-store"
import { sortTracks } from "@/modules/library/sort-utils"
import { useTracksByAlbumName } from "@/modules/library/queries"
import { getSafeRouteName } from "@/modules/navigation/route-params"
import { scheduleRouteWarning } from "@/modules/navigation/route-warning-runtime"
import { usePlayerTracks } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll } from "@/modules/ui/store"
import { usePlaybackActions, useDetailScrollHandlers, resolveSortLabel } from "@/modules/library/ui/detail-helpers"
import { mergeText } from "@/utils/merge-text"

const HEADER_COLLAPSE_THRESHOLD = 120

export default function AlbumDetailsScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const router = useRouter()
  const { name, transitionId } = useLocalSearchParams<{
    name: string
    transitionId?: string
  }>()
  const toggleFavoriteMutation = useToggleFavorite()
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const allTracks = usePlayerTracks()
  const parsedAlbumRouteName = React.useMemo(() => getSafeRouteName(name), [name])
  const albumName = parsedAlbumRouteName.value

  scheduleRouteWarning({
    key: "album-details:missing-name",
    message: "Album details route missing name param",
    metadata: { route: "/album/[name]" },
    enabled: !albumName.trim(),
  })
  scheduleRouteWarning({
    key: `album-details:decode-failed:${parsedAlbumRouteName.raw}`,
    message: "Album details route name decode failed",
    metadata: {
      route: "/album/[name]",
      rawName: parsedAlbumRouteName.raw,
    },
    enabled: parsedAlbumRouteName.decodeFailed,
  })

  const normalizedAlbumName = albumName.trim().toLowerCase()
  const {
    data: albumTracksFromQuery = [],
    isLoading: isAlbumTracksLoading,
    isFetching: isAlbumTracksFetching,
  } = useTracksByAlbumName(albumName)
  const albumTracks =
    albumTracksFromQuery.length > 0
      ? albumTracksFromQuery
      : allTracks.filter(
          (track) => (track.album || "").trim().toLowerCase() === normalizedAlbumName
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
  const sortConfig = allSortConfigs.AlbumTracks || {
    field: "trackNumber" as AlbumTrackSortField,
    order: "asc" as const,
  }
  const sortedTracks = sortTracks(albumTracks, sortConfig)
  const albumId = albumTracks[0]?.albumId
  const albumTransitionId = resolveAlbumTransitionId({
    transitionId,
    id: albumId,
    title: albumInfo?.title || albumName,
  })
  const { data: isAlbumFavorite = false } = useIsFavorite("album", albumId || "")
  const isLoading = (isAlbumTracksLoading || isAlbumTracksFetching) && albumTracks.length === 0
  const totalDurationLabel = formatAlbumDuration(totalDuration)
  const hasMultipleDiscs = new Set(sortedTracks.map((track) => track.discNumber || 1)).size > 1

  function handleSortSelect(field: AlbumTrackSortField, order?: "asc" | "desc") {
    setSortConfig("AlbumTracks", field, order)
  }

  function handleBack() {
    router.back()
  }

  if (!albumInfo) {
    if (isLoading) {
      return <View className="flex-1 bg-background" />
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

  function playSelectedTrack(track: Track) {
    playTrack(track, sortedTracks, {
      type: "album",
      title: activeAlbumInfo.title,
    })
  }

  const { playAll: playAllTracks, shuffle: shuffleTracks } = usePlaybackActions(
    sortedTracks,
    { type: "album", title: activeAlbumInfo.title }
  )
  const scrollHandlers = useDetailScrollHandlers()

  function getSortLabel() {
    return resolveSortLabel(ALBUM_TRACK_SORT_OPTIONS, sortConfig.field, t)
  }

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={setSortModalVisible}
      currentField={sortConfig.field as AlbumTrackSortField}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: showHeaderTitle ? albumInfo.title : "",
            headerBackVisible: false,
            headerLeft: () => <BackButton className="-ml-2" onPress={handleBack} />,
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
                      <LocalFavouriteSolidIcon
                        fill="none"
                        width={24}
                        height={24}
                        color={theme.danger}
                      />
                    ) : (
                      <LocalFavouriteIcon
                        fill="none"
                        width={24}
                        height={24}
                        color={theme.foreground}
                      />
                    )}
                  </Button>
                  <Button variant="ghost" isIconOnly onPress={() => setShowActionSheet(true)}>
                    <LocalMoreHorizontalCircle01SolidIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.foreground}
                    />
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
          onTrackPress={playSelectedTrack}
          resetScrollKey={`${albumId || albumInfo.title}-${sortConfig.field}-${sortConfig.order}`}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(event) => {
            const y = event.nativeEvent.contentOffset.y
            handleScroll(y)
            const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
            if (nextShowHeaderTitle !== showHeaderTitle) {
              setShowHeaderTitle(nextShowHeaderTitle)
            }
          }}
          {...scrollHandlers}
          listHeader={
            <>
              <View
                style={{
                  paddingTop: SCREEN_SECTION_TOP_SPACING,
                  paddingBottom: DETAIL_HEADER_BOTTOM_SPACING,
                }}
              >
                <View className="flex-row gap-4">
                  <Transition.Boundary.View id={albumTransitionId}>
                    <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                      {albumInfo.image ? (
                        <Image
                          source={{ uri: albumInfo.image }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <LocalVynil02SolidIcon
                            fill="none"
                            width={48}
                            height={48}
                            color={theme.muted}
                          />
                        </View>
                      )}
                    </View>
                  </Transition.Boundary.View>

                  <View className="flex-1 justify-center">
                    <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
                      {albumInfo.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted" numberOfLines={1}>
                      {albumInfo.artist}
                    </Text>
                    <Text className="mt-2 text-sm text-muted">
                      {mergeText([albumInfo?.year, totalDurationLabel])}
                    </Text>
                  </View>
                </View>
              </View>

              <Animated.View entering={screenEnterTransition()}>
                <PlaybackActionsRow
                  onPlay={playAllTracks}
                  onShuffle={shuffleTracks}
                  className="mb-4"
                />
              </Animated.View>

              <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
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
