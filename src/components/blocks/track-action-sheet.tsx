import { Image } from "expo-image"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalInfoIcon from "@/components/icons/local/info"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalNextIcon from "@/components/icons/local/next"
import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { ICON_SIZES } from "@/lib/layout"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { useIsFavorite } from "@/domains/favorites/queries"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import { addToQueue, queueTrackNext } from "@/playback/queue-actions"
import type { PlayerTrack } from "@/playback/types"
import { TrackMetadataSheet } from "./track-metadata-sheet"
import { PlaylistPickerSheet } from "./playlist-picker-sheet"
import { useRemoveTrackFromPlaylist } from "@/domains/playlists/queries"
import { showAppToast } from "@/core/ui/toast"

interface TrackActionSheetProps {
  track: PlayerTrack | null
  isOpen: boolean
  onClose: () => void
  playlistId?: string
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  onClose,
  playlistId,
}) => {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const toggleFavoriteMutation = useToggleFavorite()
  const removeTrackFromPlaylistMutation = useRemoveTrackFromPlaylist()
  const [isMetadataSheetOpen, setIsMetadataSheetOpen] = React.useState(false)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = React.useState(false)

  const { data: isFavoriteData = false } = useIsFavorite("track", track?.id ?? "")

  if (!track) {
    return (
      <ActionSheet.Root isOpen={false} onOpenChange={() => {}}>
        <ActionSheet.Content>
          <View />
        </ActionSheet.Content>
      </ActionSheet.Root>
    )
  }

  const fallbackArtist = track.artist || t("library.unknownArtist")
  const fallbackAlbum = track.album || t("library.unknownAlbum")

  const handleToggleFavorite = () => {
    void toggleFavoriteMutation.mutateAsync({
      type: "track",
      itemId: track.id,
      isCurrentlyFavorite: isFavoriteData,
      name: track.title,
      subtitle: track.artist,
      image: track.image,
    })
    onClose()
  }

  return (
    <>
      <ActionSheet.Root
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (open) {
            return
          }
          onClose()
        }}
      >
        <ActionSheet.Content
          enableDynamicSizing={true}
          contentContainerClassName="px-5 pt-2 pb-safe-offset-4"
        >
          <View className="mb-5 flex-row items-center gap-4">
            <View className="h-18 w-18 overflow-hidden rounded-xl bg-default">
              {track.image ? (
                <Image source={{ uri: track.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
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
                isFavoriteData ? (
                  <LocalFavouriteSolidIcon fill="none" width={22} height={22} color={theme.danger} />
                ) : (
                  <LocalFavouriteIcon fill="none" width={22} height={22} color={theme.muted} />
                )
              }
              label={isFavoriteData ? t("track.removeFromFavorites") : t("track.addToFavorites")}
              onPress={handleToggleFavorite}
            />
            <MenuRow
              icon={<LocalNextIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.playNext")}
              onPress={() => {
                queueTrackNext(track)
                onClose()
              }}
            />
            <MenuRow
              icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.addToQueue")}
              onPress={() => {
                addToQueue(track)
                onClose()
              }}
            />
            <MenuRow
              icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.addToPlaylist")}
              onPress={() => setIsPlaylistPickerOpen(true)}
            />
            {playlistId ? (
              <MenuRow
                icon={<LocalCancel01Icon fill="none" width={22} height={22} color={theme.danger} />}
                label={t("track.removeFromThisPlaylist")}
                onPress={() => {
                  void removeTrackFromPlaylistMutation.mutateAsync({
                    playlistId,
                    trackId: track.id,
                  })
                  showAppToast(t("common.feedback.removedFromPlaylist"))
                  onClose()
                }}
              />
            ) : null}
            <MenuRow
              icon={<LocalInfoIcon fill="none" width={22} height={22} color={theme.muted} />}
              label={t("track.viewMetadata")}
              onPress={() => setIsMetadataSheetOpen(true)}
            />
          </View>
        </ActionSheet.Content>
      </ActionSheet.Root>

      <TrackMetadataSheet track={track} isOpen={isMetadataSheetOpen} onOpenChange={setIsMetadataSheetOpen} />
      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onClose={() => setIsPlaylistPickerOpen(false)}
        trackIds={[track.id]}
      />
    </>
  )
}

export default TrackActionSheet
