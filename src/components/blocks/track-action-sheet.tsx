/**
 * Purpose: Displays track actions and metadata, including clickable multi-value artist and genre navigation.
 * Caller: Track list and playlist screens opening track context actions.
 * Dependencies: HeroUI Native sheets, shared artist picker, track queries, playlist/favorites services, split settings state, and router navigation.
 * Main Functions: TrackActionSheet()
 * Side Effects: Opens dialogs/sheets, queues playback actions, and navigates to artist/album/genre routes.
 */

import type { PlayerQueueContext, Track } from "@/modules/player/types"
import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import * as React from "react"
import { useState } from "react"

import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { DeleteTrackDialog } from "@/components/blocks/delete-track-dialog"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import {
  ArtistPickerSheet,
  type ArtistPickerSheetItem,
} from "@/components/blocks/artist-picker-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { ActionSheet } from "@/components/ui/action-sheet"
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalDelete01SolidIcon from "@/components/icons/local/delete-01-solid"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPlaylist02SolidIcon from "@/components/icons/local/playlist-02-solid"
import LocalSlidersVerticalIcon from "@/components/icons/local/sliders-vertical"
import LocalUserIcon from "@/components/icons/local/user"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { addToQueue, queueTrackNext } from "@/modules/player/queue"
import { useRemoveTrackFromPlaylist } from "@/modules/playlist/mutations"
import { usePlaylistPickerSelection } from "@/modules/playlist/use-picker-selection"
import { showAppToast } from "@/modules/ui/toast"
import { useTrack } from "@/modules/tracks/queries"
import { useThemeColors } from "@/modules/ui/theme"
import { useSettingsStore } from "@/modules/settings/store"
import { splitArtistsValue } from "@/modules/settings/split-multiple-values"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { TrackMetadataSheet } from "@/modules/tracks/ui/track-metadata-sheet"
import LocalNextIcon from "../icons/local/next"
import LocalAddCircleIcon from "../icons/local/add-circle"
import LocalPlaylist02Icon from "../icons/local/playlist-02"
import LocalVynil02Icon from "../icons/local/vynil-02"
import LocalInfoIcon from "../icons/local/info"
import LocalDelete02Icon from "../icons/local/delete-02"

interface TrackActionSheetProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  tracks?: Track[]
  playlistId?: string
  queueContext?: PlayerQueueContext | null
  onAddToPlaylist?: (track: Track) => void
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  onClose,
  playlistId,
  onAddToPlaylist,
}) => {
  const router = useRouter()
  const { t } = useTranslation()
  const theme = useThemeColors()
  const toggleFavoriteMutation = useToggleFavorite()
  const removeTrackFromPlaylistMutation = useRemoveTrackFromPlaylist()

  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({})

  const favoriteTrackId = track?.id || ""
  const { data: isFavoriteData = track?.isFavorite ?? false } = useIsFavorite(
    "track",
    favoriteTrackId
  )
  const isFavorite = track ? (favoriteOverrides[track.id] ?? Boolean(isFavoriteData)) : false
  const { data: fullTrackData } = useTrack(track?.id ?? "")
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)

  const [artistSelectionItems, setArtistSelectionItems] = useState<ArtistPickerSheetItem[]>([])
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isMetadataSheetOpen, setIsMetadataSheetOpen] = useState(false)

  const handleToggleFavorite = () => {
    if (track) {
      const newState = !isFavorite
      setFavoriteOverrides((prev) => ({ ...prev, [track.id]: newState }))
      void toggleFavoriteMutation.mutateAsync({
        type: "track",
        itemId: track.id,
        isCurrentlyFavorite: isFavorite,
        name: track.title,
        subtitle: track.artist,
        image: track.image,
      })
    }
  }

  const handlePlayNext = async () => {
    if (track) {
      await queueTrackNext(track)
      onClose()
    }
  }

  const handleAddToQueue = async () => {
    if (track) {
      await addToQueue(track)
      onClose()
    }
  }

  const handleAddToPlaylist = () => {
    if (!track) {
      return
    }

    if (onAddToPlaylist) {
      onAddToPlaylist(track)
      onClose()
      return
    }

    setIsPlaylistPickerOpen(true)
  }

  const handleRemoveFromPlaylist = async () => {
    if (!track || !playlistId) {
      return
    }

    await removeTrackFromPlaylistMutation.mutateAsync({
      playlistId,
      trackId: track.id,
    })
    onClose()
  }

  const handleOpenDeleteDialog = () => {
    if (!track) {
      return
    }

    setIsPlaylistPickerOpen(false)
    setIsDeleteDialogOpen(true)
    onClose()
  }

  const showPlaylistToast = (title: string, description?: string) => {
    showAppToast(title, description)
  }

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: track?.id,
    onSelectionApplied: () => {
      setIsPlaylistPickerOpen(false)
      onClose()
    },
    showPlaylistToast,
  })

  const handleCreatePlaylist = () => {
    setIsPlaylistPickerOpen(false)
    onClose()
    router.push("/playlist/form")
  }

  const handleOpenArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    setIsArtistSelectionOpen(false)
    router.push({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
    onClose()
  }

  const handleOpenAlbum = (albumName: string) => {
    const normalizedAlbumName = albumName.trim()
    if (!normalizedAlbumName) {
      return
    }

    router.push({
      pathname: "/album/[name]",
      params: {
        name: normalizedAlbumName,
        transitionId: resolveAlbumTransitionId({
          id: track?.albumId,
          title: normalizedAlbumName,
        }),
      },
    })
    onClose()
  }

  function dedupeValues(values: string[]) {
    const seen = new Set<string>()
    return values.filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  const artistNames = (() => {
    const relationNames = [
      fullTrackData?.artist?.name?.trim(),
      ...(fullTrackData?.featuredArtists?.map((entry) => entry.artist?.name?.trim()) ?? []),
    ].filter((value): value is string => Boolean(value))

    if (relationNames.length > 0) {
      return dedupeValues(relationNames)
    }

    const fallbackNames = splitArtistsValue(track?.artist, splitMultipleValueConfig)
    return fallbackNames.length > 0 ? dedupeValues(fallbackNames) : []
  })()

  const albumNames = (() => {
    const relationAlbumName = fullTrackData?.album?.title?.trim()
    if (relationAlbumName) {
      return [relationAlbumName]
    }

    const fallbackAlbumName = track?.album?.trim()
    return fallbackAlbumName ? [fallbackAlbumName] : []
  })()

  const handleOpenArtistSelection = (values: string[]) => {
    const normalized = dedupeValues(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }

    const richArtistItems = buildArtistPickerItems(
      {
        artwork: fullTrackData?.artwork,
        albumArtwork: fullTrackData?.album?.artwork,
        artist: fullTrackData?.artist,
        featuredArtists: fullTrackData?.featuredArtists,
      },
      normalized,
      (count) => t("library.count.track", { count })
    )

    setArtistSelectionItems(
      richArtistItems.length > 0 ? richArtistItems : normalized.map((value) => ({ value }))
    )
    setIsArtistSelectionOpen(true)
  }

  if (!track) {
    return (
      <ActionSheet.Root isOpen={false} onOpenChange={() => {}}>
        <ActionSheet.Content />
      </ActionSheet.Root>
    )
  }

  const fallbackArtist = track.artist || t("library.unknownArtist")
  const fallbackAlbum = track.album || t("library.unknownAlbum")

  return (
    <>
      <ActionSheet.Root
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (open) {
            return
          }

          setIsPlaylistPickerOpen(false)
          onClose()
        }}
      >
        <ActionSheet.Content
          snapPoints={["70%"]}
          enableDynamicSizing={true}
          contentContainerClassName="px-5 pt-2 pb-5"
        >
          <View className="mb-5 flex-row items-center gap-4">
            <View className="h-18 w-18 overflow-hidden rounded-xl bg-default">
              {track.image ? (
                <Image
                  source={{ uri: track.image }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-default">
                  <LocalMusicNote04SolidIcon
                    fill="none"
                    width={ICON_SIZES.sheetArtworkFallback}
                    height={ICON_SIZES.sheetArtworkFallback}
                    color={theme.muted}
                  />
                </View>
              )}
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl leading-7 font-bold text-foreground">{track.title}</Text>
              <Text className="text-sm text-muted">{fallbackArtist}</Text>
              <Text className="text-xs text-muted/90" numberOfLines={1}>
                {fallbackAlbum}
              </Text>
            </View>
          </View>

          <View className="gap-1">
            <MenuRow
              icon={
                isFavorite ? (
                  <LocalFavouriteSolidIcon
                    fill="none"
                    width={22}
                    height={22}
                    color={theme.danger}
                  />
                ) : (
                  <LocalFavouriteIcon fill="none" width={22} height={22} color={theme.muted} />
                )
              }
              label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
              onPress={handleToggleFavorite}
            />
            <MenuRow
              icon={<LocalNextIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.playNext")}
              onPress={handlePlayNext}
            />
            <MenuRow
              icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.addToQueue")}
              onPress={handleAddToQueue}
            />
            <MenuRow
              icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.addToPlaylist")}
              onPress={handleAddToPlaylist}
            />
            {playlistId ? (
              <MenuRow
                icon={<LocalCancel01Icon fill="none" width={22} height={22} color={theme.muted} />}
                label={t("track.removeFromPlaylist")}
                onPress={() => {
                  void handleRemoveFromPlaylist()
                }}
              />
            ) : null}
            <MenuRow
              icon={<LocalUserIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("player.menu.goToArtist")}
              onPress={() => handleOpenArtistSelection(artistNames)}
            />
            <MenuRow
              icon={<LocalVynil02Icon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("player.menu.goToAlbum")}
              onPress={() => {
                if (albumNames.length > 0 && albumNames[0]) {
                  handleOpenAlbum(albumNames[0])
                }
              }}
            />
            <MenuRow
              icon={<LocalInfoIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.viewMetadata")}
              onPress={() => setIsMetadataSheetOpen(true)}
            />
            <MenuRow
              icon={<LocalDelete02Icon fill="none" width={22} height={22} color="red" />}
              label={t("track.deleteFromDevice")}
              onPress={handleOpenDeleteDialog}
              colorClassName="text-danger"
            />
          </View>
        </ActionSheet.Content>
      </ActionSheet.Root>

      <TrackMetadataSheet
        track={track}
        isOpen={isMetadataSheetOpen}
        onOpenChange={setIsMetadataSheetOpen}
        onCloseParent={onClose}
      />

      <DeleteTrackDialog
        track={track}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleted={() => {
          setIsPlaylistPickerOpen(false)
          onClose()
        }}
      />

      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onOpenChange={setIsPlaylistPickerOpen}
        trackId={track.id}
        isSelecting={isSelecting}
        onCreatePlaylist={handleCreatePlaylist}
        onSelectPlaylist={(playlist) => {
          void handleSelectPlaylist(playlist)
        }}
      />

      <ArtistPickerSheet
        isOpen={isArtistSelectionOpen}
        title={t("track.metadata.artist")}
        items={artistSelectionItems}
        onOpenChange={setIsArtistSelectionOpen}
        onSelectValue={handleOpenArtist}
      />
    </>
  )
}

export default TrackActionSheet
