import { useLocalSearchParams, Stack } from "expo-router"
import { Button, useThemeColor } from "heroui-native"
import { useGuardedRouter } from "@/core/navigation"
import * as React from "react"
import { useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import Animated from "react-native-reanimated"

import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import LocalPlaylist02SolidIcon from "@/components/icons/local/playlist-02-solid"
import LocalEdit02Icon from "@/components/icons/local/edit-02"
import LocalDelete02Icon from "@/components/icons/local/delete-02"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { DeletePlaylistDialog } from "@/components/blocks/delete-playlist-dialog"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import { BackButton } from "@/components/patterns/back-button"
import { MenuRow } from "@/components/ui/menu-row"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { screenEnterTransition } from "@/lib/animations"
import { formatDurationVerbose } from "@/lib/format"
import { handleScroll } from "@/core/ui/store"
import { getPreferenceState } from "@/core/preferences/store"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import { useIsFavorite } from "@/domains/favorites/queries"
import {
  ALBUM_TRACK_SORT_OPTIONS,
  resolveSortLabel,
  type SortOption,
} from "@/domains/library/sort-constants"
import type { SortOptionField } from "@/domains/library/sort-constants"
import { useDeletePlaylist, usePlaylist } from "@/domains/playlists/queries"
import type { PlaylistDetailTrack } from "@/domains/playlists/utils"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import { usePlaybackActions } from "@/domains/library/detail-actions"

const HEADER_COLLAPSE_THRESHOLD = 120

const PLAYLIST_TRACK_SORT_OPTIONS: SortOption[] = [
  { label: "library.sortOption.customOrder", field: "playlistOrder" as const },
  { label: "library.sortOption.addedToPlaylist", field: "playlistAddedAt" as const },
  ...ALBUM_TRACK_SORT_OPTIONS,
]

function comparePlaylistAddedAt(
  left: PlaylistDetailTrack,
  right: PlaylistDetailTrack,
  order: "asc" | "desc"
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
  field: SortOptionField,
  order: "asc" | "desc"
): PlaylistDetailTrack[] {
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

  const byTitle = (a: PlayerTrack, b: PlayerTrack) =>
    (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" })
  const sorted = [...tracks].sort(byTitle)
  return order === "asc" ? sorted : sorted.reverse()
}

export function PlaylistDetailScreen() {
  const { t } = useTranslation()
  const router = useGuardedRouter()
  const [muted, danger, foreground] = useThemeColor(["muted", "danger", "foreground"])
  const { id } = useLocalSearchParams<{ id: string }>()
  const playlistId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "")
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [sortField, setSortField] = useState<SortOptionField>("playlistOrder")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const { data: playlist, isLoading } = usePlaylist(playlistId)
  const { data: isFavoriteData = false } = useIsFavorite("playlist", playlistId)
  const toggleFavoriteMutation = useToggleFavorite()
  const deletePlaylistMutation = useDeletePlaylist()

  const tracks = useMemo<PlaylistDetailTrack[]>(
    () =>
      (playlist?.tracks ?? [])
        .filter((rel) => rel.track)
        .map((rel) => {
          const row = rel.track!
          const base = toPlayerTrack(
            {
              id: row.id,
              name: row.title,
              artists: row.artistName ? [row.artistName] : null,
              artistName: row.artistName,
              rawArtistName: row.rawArtist,
              albumName: row.albumTitle,
              albumId: row.albumId,
              artwork: row.artwork ?? row.albumArtwork,
              uri: row.uri,
              duration: row.duration,
              discoverTime: row.dateAdded,
              modificationTime: null,
            },
            splitConfig
          )
          // SAFETY: the fallback literal supplies every field the detail rows read below; optional playback metadata is filled explicitly
          const playerTrack = (base ?? {
            id: row.id,
            title: row.title,
            duration: row.duration,
            uri: row.uri,
            image: row.artwork ?? undefined,
            artist: row.artistName ?? undefined,
            album: row.albumTitle ?? undefined,
          }) as PlayerTrack

          return {
            ...playerTrack,
            year: playerTrack.year ?? row.year ?? undefined,
            playCount: playerTrack.playCount ?? row.playCount ?? undefined,
            lastPlayedAt: playerTrack.lastPlayedAt ?? row.lastPlayedAt ?? undefined,
            filename: playerTrack.filename ?? row.filename ?? undefined,
            discNumber: playerTrack.discNumber ?? row.discNumber ?? undefined,
            trackNumber: playerTrack.trackNumber ?? row.trackNumber ?? undefined,
            dateAdded: playerTrack.dateAdded ?? row.dateAdded ?? undefined,
            playlistAddedAt: rel.addedAt ?? 0,
            playlistPosition: rel.position ?? 0,
          }
        }),
    [playlist?.tracks, splitConfig]
  )

  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  const playlistMetaText = formatDurationVerbose(totalDuration)
  const sortedTracks = useMemo(
    () => sortPlaylistTracks(tracks, sortField, sortOrder),
    [tracks, sortField, sortOrder]
  )
  const sortLabel = resolveSortLabel(PLAYLIST_TRACK_SORT_OPTIONS, sortField)

  async function handleDeleteConfirm() {
    if (!playlist) {
      return
    }
    try {
      await deletePlaylistMutation.mutateAsync(playlist.id)
      setShowDeleteDialog(false)
      router.replace("/(main)/(library)")
    } catch {
      /* toast already shown by mutation */
    }
  }

  const { playAll, shuffle } = usePlaybackActions(
    sortedTracks,
    playlist?.name || t("library.playlists"),
    "playlist"
  )

  function toggleFavorite() {
    if (!playlist) {
      return
    }

    void toggleFavoriteMutation.mutateAsync({
      type: "playlist",
      itemId: playlist.id,
      isCurrentlyFavorite: Boolean(isFavoriteData),
      name: playlist.name,
      subtitle: t("library.count.track", { count: playlist.trackCount || 0 }),
      image: playlist.artwork ?? undefined,
    })
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
        icon={<LocalPlaylist02SolidIcon fill="none" width={48} height={48} color={muted} />}
        title={t("library.playlistNotFound")}
        message={t("library.playlistRemovedMessage")}
        className="mt-12"
      />
    )
  }

  function handleSortSelect(field: SortOptionField, order?: "asc" | "desc") {
    const selectedField = field
    const isNewField = selectedField !== sortField
    const defaultOrder: "asc" | "desc" =
      selectedField === "playlistOrder"
        ? "asc"
        : selectedField === "playlistAddedAt"
          ? "desc"
          : (order ?? "asc")
    setSortField(selectedField)
    setSortOrder(isNewField ? defaultOrder : (order ?? sortOrder))
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
            headerLeft: () => <BackButton className="-ml-2" />,
            headerRight: () => (
              <View className="-mr-2 flex-row gap-4">
                <Button onPress={toggleFavorite} variant="ghost" className="-mr-2" isIconOnly>
                  {isFavoriteData ? (
                    <LocalFavouriteSolidIcon fill="none" width={24} height={24} color={danger} />
                  ) : (
                    <LocalFavouriteIcon fill="none" width={24} height={24} color={foreground} />
                  )}
                </Button>
                <Button variant="ghost" isIconOnly onPress={() => setShowActionSheet(true)}>
                  <LocalMoreHorizontalCircle01SolidIcon
                    fill="none"
                    width={24}
                    height={24}
                    color={foreground}
                  />
                </Button>
              </View>
            ),
          }}
        />

        <TrackList
          playlistId={playlistId}
          data={sortedTracks}
          queueContext={{ type: "playlist", title: playlist.name }}
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
              <View className="pt-6 pb-6">
                <View className="flex-row gap-4">
                  <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                    <PlaylistArtwork
                      images={playlist.images}
                      fallback={
                        <LocalPlaylist02SolidIcon
                          fill="none"
                          width={48}
                          height={48}
                          color={muted}
                        />
                      }
                    />
                  </View>

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

              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  {t("library.count.track", { count: tracks.length })}
                </Text>
                <SortSheet.Trigger label={t(sortLabel || "library.sortBy")} iconSize={16} />
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
          subtitle={playlistMetaText}
          image={playlist.artwork ?? undefined}
          images={playlist.images}
          trackCount={playlist.trackCount || 0}
        >
          <MenuRow
            icon={<LocalEdit02Icon fill="none" width={22} height={22} color={muted} />}
            label={t("playlist.editPlaylist")}
            onPress={() => {
              setShowActionSheet(false)
              router.push({ pathname: "/playlist/form", params: { id: playlist.id } })
            }}
          />
          <MenuRow
            icon={<LocalDelete02Icon fill="none" width={22} height={22} color={danger} />}
            label={t("playlist.deletePlaylist")}
            colorClassName="text-danger"
            onPress={() => {
              setShowActionSheet(false)
              setShowDeleteDialog(true)
            }}
          />
        </CollectionActionSheet>

        <SortSheet.Content options={PLAYLIST_TRACK_SORT_OPTIONS} />
        <DeletePlaylistDialog
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={() => {
            void handleDeleteConfirm()
          }}
          isDeleting={deletePlaylistMutation.isPending}
        />
      </View>
    </SortSheet>
  )
}
