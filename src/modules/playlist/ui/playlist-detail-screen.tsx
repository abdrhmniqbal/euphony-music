/**
 * Purpose: Renders playlist details with artwork, playback actions, sorted track list, and playlist management actions.
 * Caller: Expo Router playlist detail route.
 * Dependencies: playlist queries and mutations, favorites mutations, playback service, sort sheet, track list, theme and navigation stores.
 * Main Functions: PlaylistDetailsScreen()
 * Side Effects: Starts playlist-context playback, toggles favorites, deletes playlists, opens action sheets, updates scroll UI state.
 */

import type { TrackSortField } from "@/modules/library/sort-types"
import type { PlaylistDetailTrack } from "@/modules/playlist/utils"
import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation"
import { Button } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import Animated from "react-native-reanimated"

import { MenuRow } from "@/modules/shared/components/ui/menu-row"
import { CollectionActionSheet } from "@/modules/library/ui/collection-action-sheet"
import { DeletePlaylistDialog } from "@/modules/playlist/ui/delete-playlist-dialog"
import { PlaybackActionsRow } from "@/modules/player/ui/playback-actions-row"
import { SortSheet } from "@/modules/library/ui/sort-sheet"
import { TrackList } from "@/modules/tracks/ui/track-list"
import LocalFavouriteIcon from "@/modules/shared/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/modules/shared/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/modules/shared/components/icons/local/more-horizontal-circle-01-solid"
import LocalPlaylist02SolidIcon from "@/modules/shared/components/icons/local/playlist-02-solid"
import { BackButton } from "@/modules/shared/components/patterns/back-button"
import { PlaylistArtwork } from "@/modules/playlist/ui/playlist-artwork"
import { collectPlaylistImages } from "@/modules/playlist/repository"
import { EmptyState } from "@/modules/shared/components/ui/empty-state"
import { ScaleLoader } from "@/modules/shared/components/ui/scale-loader"
import { screenEnterTransition } from "@/modules/shared/constants/animations"
import { DETAIL_HEADER_BOTTOM_SPACING, SCREEN_SECTION_TOP_SPACING } from "@/modules/shared/constants/layout"
import { Stack } from "@/modules/shared/layouts/stack"
import { resolvePlaylistTransitionId } from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { TRACK_SORT_OPTIONS } from "@/modules/library/sort-constants"
import { sortTracks } from "@/modules/library/sort-utils"
import { scheduleRouteWarning } from "@/modules/navigation"
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
import { handleScroll } from "@/modules/ui/store"
import { usePlaybackActions, resolveSortLabel } from "@/modules/library/ui/detail-helpers"
import LocalEdit02Icon from "@/modules/shared/components/icons/local/edit-02"
import LocalDelete02Icon from "@/modules/shared/components/icons/local/delete-02"

const HEADER_COLLAPSE_THRESHOLD = 120
type PlaylistTrackSortField = TrackSortField | "playlistAddedAt" | "playlistOrder"
type PlaylistTrackSortOrder = "asc" | "desc"

const PLAYLIST_TRACK_SORT_OPTIONS: {
  label: string
  field: PlaylistTrackSortField
}[] = [
  { label: "library.sortOption.customOrder", field: "playlistOrder" },
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

  if (field === "playlistOrder") {
    return [...tracks].sort((left, right) =>
      order === "asc"
        ? left.playlistPosition - right.playlistPosition
        : right.playlistPosition - left.playlistPosition
    )
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
  const [sortField, setSortField] = useState<PlaylistTrackSortField>("playlistOrder")
  const [sortOrder, setSortOrder] = useState<PlaylistTrackSortOrder>("asc")
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
  const sortLabel = resolveSortLabel(PLAYLIST_TRACK_SORT_OPTIONS, sortField, t)

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

  const { playAll, shuffle } = usePlaybackActions(
    sortedTracks,
    { type: "playlist", title: playlist?.name || t("library.playlists") }
  )

  function handleSortSelect(field: PlaylistTrackSortField, order?: PlaylistTrackSortOrder) {
    const isNewField = field !== sortField
    const defaultOrder: PlaylistTrackSortOrder =
      field === "playlistOrder" ? "asc" : field === "playlistAddedAt" ? "desc" : (order ?? "asc")
    const nextOrder = isNewField ? defaultOrder : (order ?? sortOrder)

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
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ScaleLoader size={22} />
        </View>
      )
    }

    return (
      <EmptyState
        icon={<LocalPlaylist02SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
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
            handleScroll()
            const y = e.nativeEvent.contentOffset.y
            const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
            if (nextShowHeaderTitle !== showHeaderTitle) {
              setShowHeaderTitle(nextShowHeaderTitle)
            }
          }}
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
                          <LocalPlaylist02SolidIcon
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

        <CollectionActionSheet
          visible={showActionSheet}
          onOpenChange={setShowActionSheet}
          type="playlist"
          id={playlist.id}
          favoriteId={playlist.id}
          name={playlist.name}
          subtitle={formatDuration(totalDuration)}
          image={playlist.artwork || undefined}
          images={collectPlaylistImages(playlist)}
          trackCount={playlist.trackCount || 0}
        >
          <MenuRow
            icon={<LocalEdit02Icon fill="none" width={22} height={22} color={theme.muted} />}
            label={t("playlist.editPlaylist")}
            onPress={() => {
              setShowActionSheet(false)
              router.push({ pathname: "/playlist/form", params: { id: playlist.id } })
            }}
          />
          <MenuRow
            icon={<LocalDelete02Icon fill="none" width={22} height={22} color={theme.danger} />}
            label={t("playlist.deletePlaylist")}
            onPress={() => {
              setShowActionSheet(false)
              setShowDeleteDialog(true)
            }}
            colorClassName="text-danger"
          />
        </CollectionActionSheet>
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
