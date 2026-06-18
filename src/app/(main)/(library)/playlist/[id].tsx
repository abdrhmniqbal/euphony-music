/**
 * Purpose: Renders playlist details with artwork, playback actions, sorted track list, and playlist management actions.
 * Caller: Expo Router playlist detail route.
 * Dependencies: playlist queries and mutations, favorites mutations, playback service, sort sheet, track list, theme and navigation stores.
 * Main Functions: PlaylistDetailsScreen()
 * Side Effects: Starts playlist-context playback, toggles favorites, deletes playlists, opens action sheets, updates scroll UI state.
 */

import type { TrackSortField } from "@/modules/library/sort.types"
import type { PlaylistDetailTrack } from "@/modules/playlist/utils"
import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import Animated from "react-native-reanimated"

import { DeletePlaylistDialog } from "@/components/blocks/delete-playlist-dialog"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { PlaylistActionsSheet } from "@/components/blocks/playlist-actions-sheet"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import { BackButton } from "@/components/patterns/back-button"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import { screenEnterTransition } from "@/constants/animations"
import { DETAIL_HEADER_BOTTOM_SPACING, SCREEN_SECTION_TOP_SPACING } from "@/constants/layout"
import { Stack } from "@/layouts/stack"
import { resolvePlaylistTransitionId } from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { TRACK_SORT_OPTIONS } from "@/modules/library/sort.constants"
import { sortTracks } from "@/modules/library/sort.utils"
import { scheduleRouteWarning } from "@/modules/navigation/route-warning-runtime"
import { playTrack } from "@/modules/player/service"
import { useDeletePlaylist } from "@/modules/playlist/mutations"
import { usePlaylist } from "@/modules/playlist/queries"
import { formatDuration } from "@/modules/playlist/utils"
import {
  buildPlaylistImages,
  buildPlaylistTracks,
  getPlaylistDuration,
} from "@/modules/playlist/utils"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"

const HEADER_COLLAPSE_THRESHOLD = 120
type PlaylistTrackSortField = TrackSortField | "playlistAddedAt"
type PlaylistTrackSortOrder = "asc" | "desc"

const PLAYLIST_TRACK_SORT_OPTIONS: {
  label: string
  field: PlaylistTrackSortField
}[] = [
  { label: "library.sortOption.addedToPlaylist", field: "playlistAddedAt" },
  ...TRACK_SORT_OPTIONS,
]

function comparePlaylistAddedAt(
  left: PlaylistDetailTrack,
  right: PlaylistDetailTrack,
  order: PlaylistTrackSortOrder
) {
  const leftValue = left.playlistAddedAt || 0
  const rightValue = right.playlistAddedAt || 0

  if (leftValue === rightValue) {
    return order === "asc"
      ? left.playlistPosition - right.playlistPosition
      : right.playlistPosition - left.playlistPosition
  }

  return order === "asc" ? leftValue - rightValue : rightValue - leftValue
}

function sortPlaylistTracks(
  tracks: PlaylistDetailTrack[],
  field: PlaylistTrackSortField,
  order: PlaylistTrackSortOrder
) {
  if (field === "playlistAddedAt") {
    return [...tracks].sort((left, right) => comparePlaylistAddedAt(left, right, order))
  }

  return sortTracks(tracks, { field, order }) as PlaylistDetailTrack[]
}

export default function PlaylistDetailsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const theme = useThemeColors()
  const { id, transitionId } = useLocalSearchParams<{
    id: string
    transitionId?: string
  }>()
  const playlistId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "")

  scheduleRouteWarning({
    key: "playlist-details:missing-id",
    message: "Playlist details route missing id param",
    metadata: { route: "/playlist/[id]" },
    enabled: !playlistId.trim(),
  })
  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [sortField, setSortField] = useState<PlaylistTrackSortField>("playlistAddedAt")
  const [sortOrder, setSortOrder] = useState<PlaylistTrackSortOrder>("desc")
  const { data: playlist, isLoading } = usePlaylist(playlistId)
  const { data: isFavoriteData = false } = useIsFavorite("playlist", playlistId)
  const toggleFavoriteMutation = useToggleFavorite()
  const deletePlaylistMutation = useDeletePlaylist()
  const isFavorite = Boolean(isFavoriteData)
  const tracks = buildPlaylistTracks(playlist)
  const playlistImages = buildPlaylistImages(playlist, tracks)
  const playlistTransitionId = resolvePlaylistTransitionId({
    transitionId,
    id: playlist?.id || playlistId,
    title: playlist?.name,
  })
  const totalDuration = getPlaylistDuration(tracks)
  const playlistMetaText = formatDuration(totalDuration)
  const sortedTracks = sortPlaylistTracks(tracks, sortField, sortOrder)
  const selectedSortOption = PLAYLIST_TRACK_SORT_OPTIONS.find(
    (option) => option.field === sortField
  )
  const sortLabel = selectedSortOption ? t(selectedSortOption.label) : t("library.sort")

  function handleBack() {
    router.back()
  }

  async function handleDeleteConfirm() {
    const didDelete = await deletePlaylist()
    if (didDelete) {
      setShowDeleteDialog(false)
      router.replace("/(main)")
    }
  }

  function playFromPlaylist(trackId: string) {
    const selectedTrack = sortedTracks.find((track) => track.id === trackId)
    if (selectedTrack) {
      playTrack(selectedTrack, sortedTracks, {
        type: "playlist",
        title: playlist?.name || t("library.playlists"),
      })
    }
  }

  function playAll() {
    if (tracks.length === 0) {
      return
    }

    playTrack(sortedTracks[0], sortedTracks, {
      type: "playlist",
      title: playlist?.name || t("library.playlists"),
    })
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * sortedTracks.length)
    playTrack(sortedTracks[randomIndex], sortedTracks, {
      type: "playlist",
      title: playlist?.name || t("library.playlists"),
    })
  }

  function handleSortSelect(field: PlaylistTrackSortField, order?: PlaylistTrackSortOrder) {
    const nextOrder =
      field === "playlistAddedAt" && field !== sortField ? "desc" : (order ?? sortOrder)

    setSortField(field)
    setSortOrder(nextOrder)
  }

  async function toggleFavorite() {
    if (!playlist) {
      return
    }

    await toggleFavoriteMutation.mutateAsync({
      type: "playlist",
      itemId: playlist.id,
      isCurrentlyFavorite: isFavorite,
      name: playlist.name,
      subtitle: t("library.count.track", {
        count: playlist.trackCount || 0,
      }),
      image: playlist.artwork || undefined,
    })
  }

  async function deletePlaylist(): Promise<boolean> {
    if (!playlist) {
      return false
    }

    try {
      await deletePlaylistMutation.mutateAsync(playlist.id)
      return true
    } catch {
      return false
    }
  }

  if (!playlist) {
    if (isLoading) {
      return <View className="flex-1 bg-background" />
    }

    return (
      <EmptyState
        icon={<LocalPlaylistSolidIcon fill="none" width={48} height={48} color={theme.muted} />}
        title={t("library.playlistNotFound")}
        message={t("library.playlistRemovedMessage")}
        className="mt-12"
      />
    )
  }

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortField}
      currentOrder={sortOrder}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: showHeaderTitle ? playlist.name : "",
            headerBackVisible: false,
            headerLeft: () => <BackButton className="-ml-2" onPress={handleBack} />,
            headerRight: () => (
              <View className="-mr-2 flex-row gap-4">
                <Button onPress={toggleFavorite} variant="ghost" className="-mr-2" isIconOnly>
                  {isFavorite ? (
                    <LocalFavouriteSolidIcon fill="none" width={24} height={24} color="#ef4444" />
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
                  <LocalMoreHorizontalCircleSolidIcon
                    fill="none"
                    width={24}
                    height={24}
                    color={theme.foreground}
                  />
                </Button>
              </View>
            ),
          }}
        />

        <TrackList
          data={sortedTracks}
          showNumbers={false}
          hideCover={false}
          hideArtist={false}
          playlistId={playlistId}
          onTrackPress={(track) => playFromPlaylist(track.id)}
          resetScrollKey={`${sortField}-${sortOrder}`}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y
            handleScroll(y)
            const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
            if (nextShowHeaderTitle !== showHeaderTitle) {
              setShowHeaderTitle(nextShowHeaderTitle)
            }
          }}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          listHeader={
            <>
              <View
                style={{
                  paddingTop: SCREEN_SECTION_TOP_SPACING,
                  paddingBottom: DETAIL_HEADER_BOTTOM_SPACING,
                }}
              >
                <View className="flex-row gap-4">
                  <Transition.Boundary.View id={playlistTransitionId}>
                    <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                      <PlaylistArtwork
                        images={playlistImages}
                        fallback={
                          <LocalPlaylistSolidIcon
                            fill="none"
                            width={48}
                            height={48}
                            color={theme.muted}
                          />
                        }
                        className="bg-surface-secondary"
                      />
                    </View>
                  </Transition.Boundary.View>

                  <View className="flex-1 justify-center">
                    <Text className="text-xl font-bold text-foreground" numberOfLines={2}>
                      {playlist.name}
                    </Text>
                    {playlist.description ? (
                      <Text className="mt-1 text-base text-muted" numberOfLines={2}>
                        {playlist.description}
                      </Text>
                    ) : null}
                    <Text className="mt-2 text-sm text-muted">{playlistMetaText}</Text>
                  </View>
                </View>
              </View>

              <Animated.View entering={screenEnterTransition()}>
                <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} className="mb-4" />
              </Animated.View>

              <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
                <Text className="text-lg font-bold text-foreground">
                  {t("library.count.track", { count: tracks.length })}
                </Text>
                <SortSheet.Trigger label={sortLabel} iconSize={16} />
              </View>
            </>
          }
        />

        <PlaylistActionsSheet
          visible={showActionSheet}
          onOpenChange={setShowActionSheet}
          onEdit={() =>
            router.push({
              pathname: "/playlist/form",
              params: { id: playlist.id },
            })
          }
          onDelete={() => setShowDeleteDialog(true)}
        />
        <DeletePlaylistDialog
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteConfirm}
          isDeleting={deletePlaylistMutation.isPending}
        />
      </View>

      <SortSheet.Content options={PLAYLIST_TRACK_SORT_OPTIONS} />
    </SortSheet>
  )
}
