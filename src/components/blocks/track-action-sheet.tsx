/**
 * Purpose: Displays track actions and metadata, including clickable multi-value artist and genre navigation.
 * Caller: Track list and playlist screens opening track context actions.
 * Dependencies: HeroUI Native sheets, shared artist picker, track queries, playlist/favorites services, split settings state, and router navigation.
 * Main Functions: TrackActionSheet()
 * Side Effects: Opens dialogs/sheets, queues playback actions, and navigates to artist/album/genre routes.
 */

import type { Track } from "@/modules/player/types"
import { Image } from "expo-image"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { DeleteTrackDialog } from "@/components/blocks/delete-track-dialog"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { ValueNavigationSheet } from "@/components/blocks/value-navigation-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { ActionSheet } from "@/components/ui/action-sheet"
import { useTrackActions } from "@/components/blocks/use-track-actions"
import { TrackMetadataSheet } from "@/modules/tracks/ui/track-metadata-sheet"
import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalDelete02Icon from "@/components/icons/local/delete-02"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalVynil02Icon from "@/components/icons/local/vynil-02"
import LocalUserIcon from "@/components/icons/local/user"
import LocalNextIcon from "@/components/icons/local/next"
import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalInfoIcon from "@/components/icons/local/info"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { useThemeColors } from "@/modules/ui/theme"

interface TrackActionSheetProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  playlistId?: string
  onAddToPlaylist?: (track: Track) => void
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  onClose,
  playlistId,
  onAddToPlaylist,
}) => {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const {
    isFavorite,
    albumNames,
    isPlaylistPickerOpen,
    setIsPlaylistPickerOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isArtistSelectionOpen,
    setIsArtistSelectionOpen,
    isMetadataSheetOpen,
    setIsMetadataSheetOpen,
    artistSelectionItems,
    isSelecting,
    handleToggleFavorite,
    handlePlayNext,
    handleAddToQueue,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    handleOpenDeleteDialog,
    handleOpenArtistSelection,
    handleOpenAlbum,
    handleOpenArtist,
    handleCreatePlaylist,
    handleSelectPlaylist,
  } = useTrackActions({ track, playlistId, onClose, onAddToPlaylist })

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
              onPress={handleOpenArtistSelection}
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

      <ValueNavigationSheet
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
