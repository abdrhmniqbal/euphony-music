/**
 * Purpose: Displays track actions and metadata, including clickable multi-value artist and genre navigation.
 * Caller: Track list and playlist screens opening track context actions.
 * Dependencies: HeroUI Native sheets, shared artist picker, track queries, playlist/favorites services, split settings state, and router navigation.
 * Main Functions: TrackActionSheet()
 * Side Effects: Opens dialogs/sheets, queues playback actions, and navigates to artist/album/genre routes.
 */

import type { Track } from "@/modules/player/store"
import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, Button } from "heroui-native"
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
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import LocalAddIcon from "@/components/icons/local/add"
import LocalCancelIcon from "@/components/icons/local/cancel"
import LocalDeleteSolidIcon from "@/components/icons/local/delete-solid"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPlaySolidIcon from "@/components/icons/local/play-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import LocalSlidersVerticalIcon from "@/components/icons/local/sliders-vertical"
import LocalUserIcon from "@/components/icons/local/user"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { playTrack } from "@/modules/player/service"
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

interface TrackActionSheetProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  tracks?: Track[]
  playlistId?: string
  onAddToPlaylist?: (track: Track) => void
}

interface MenuRowProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  colorClassName?: string
}

function MenuRow({ icon, label, onPress, colorClassName = "text-foreground" }: MenuRowProps) {
  return (
    <Button variant="ghost" onPress={onPress} className="h-13 w-full justify-start px-0">
      <View className="flex-row items-center gap-4 px-1">
        <View className="w-6 items-center justify-center">{icon}</View>
        <Text className={`text-base font-medium ${colorClassName}`}>{label}</Text>
      </View>
    </Button>
  )
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  onClose,
  tracks,
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

  const handlePlay = async () => {
    if (track) {
      playTrack(track, tracks)
      onClose()
    }
  }

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
      <BottomSheet isOpen={false} onOpenChange={() => {}}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content />
        </BottomSheet.Portal>
      </BottomSheet>
    )
  }

  const fallbackArtist = track.artist || t("library.unknownArtist")
  const fallbackAlbum = track.album || t("library.unknownAlbum")

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (open) {
            return
          }

          setIsPlaylistPickerOpen(false)
          onClose()
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={["70%"]}
            enableDynamicSizing={true}
            contentContainerClassName="px-5 pt-2 pb-5"
            backgroundClassName="bg-surface"
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
                    <LocalMusicNoteSolidIcon
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
                icon={<LocalPlaySolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("common.play")}
                onPress={handlePlay}
              />
              <MenuRow
                icon={
                  isFavorite ? (
                    <LocalFavouriteSolidIcon fill="none" width={22} height={22} color="#ef4444" />
                  ) : (
                    <LocalFavouriteIcon fill="none" width={22} height={22} color={theme.foreground} />
                  )
                }
                label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
                onPress={handleToggleFavorite}
              />
              <MenuRow
                icon={<LocalAddIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.addToQueue")}
                onPress={handleAddToQueue}
              />
              <MenuRow
                icon={<LocalNextSolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.playNext")}
                onPress={handlePlayNext}
              />
              <MenuRow
                icon={<LocalPlaylistSolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.addToPlaylist")}
                onPress={handleAddToPlaylist}
              />
              {playlistId ? (
                <MenuRow
                  icon={<LocalCancelIcon fill="none" width={22} height={22} color={theme.foreground} />}
                  label={t("track.removeFromPlaylist")}
                  onPress={() => {
                    void handleRemoveFromPlaylist()
                  }}
                />
              ) : null}
              <MenuRow
                icon={<LocalUserIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("player.menu.goToArtist")}
                onPress={() => handleOpenArtistSelection(artistNames)}
              />
              <MenuRow
                icon={<LocalVynilSolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("player.menu.goToAlbum")}
                onPress={() => {
                  if (albumNames.length > 0 && albumNames[0]) {
                    handleOpenAlbum(albumNames[0])
                  }
                }}
              />
              <MenuRow
                icon={<LocalSlidersVerticalIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.viewMetadata")}
                onPress={() => setIsMetadataSheetOpen(true)}
              />
              <MenuRow
                icon={<LocalDeleteSolidIcon fill="none" width={22} height={22} color="red" />}
                label={t("track.deleteFromDevice")}
                onPress={handleOpenDeleteDialog}
                colorClassName="text-danger"
              />
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

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
