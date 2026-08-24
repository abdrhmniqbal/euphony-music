import { BottomSheet, PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { showAppToast } from "@/core/ui/toast"
import { useGuardedRouter } from "@/core/navigation"
import { setPlaylistFormDraft } from "@/domains/playlists/form-draft-store"
import { useAddTracksToPlaylist, usePlaylistsWithOptions } from "@/domains/playlists/queries"

interface PlaylistPickerSheetProps {
  isOpen: boolean
  onClose: () => void
  trackIds: string[]
}

export function PlaylistPickerSheet({ isOpen, onClose, trackIds }: PlaylistPickerSheetProps) {
  const { t } = useTranslation()
  const router = useGuardedRouter()
  const { data: playlists = [] } = usePlaylistsWithOptions(true)
  const addTracksMutation = useAddTracksToPlaylist()

  const handleSelect = React.useCallback(
    (playlistId: string) => {
      void addTracksMutation.mutateAsync({ playlistId, trackIds })
      showAppToast(t("common.feedback.addedToPlaylist"))
      onClose()
    },
    [addTracksMutation, onClose, t, trackIds]
  )

  const handleCreateNew = React.useCallback(() => {
    setPlaylistFormDraft(trackIds)
    onClose()
    router.push("/playlist/form")
  }, [onClose, router, trackIds])

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content contentContainerClassName="px-5 pt-2 pb-safe-offset-4">
          <Text className="mb-4 text-xl font-bold text-foreground">{t("track.addToPlaylist")}</Text>
          <View className="gap-1">
            <PickerRow
              key="create-new"
              onPress={handleCreateNew}
              leading={
                <View className="h-12 w-12 items-center justify-center rounded-lg bg-default">
                  <LocalAddCircleIcon fill="none" width={22} height={22} color="#9ca3af" />
                </View>
              }
              title={t("playlist.createPlaylist")}
            />
            {playlists.map((playlist) => (
              <PickerRow
                key={playlist.id}
                onPress={() => handleSelect(playlist.id)}
                leading={
                  <View className="h-12 w-12 overflow-hidden rounded-lg bg-default">
                    <PlaylistArtwork images={resolveImages(playlist.images, playlist.image)} />
                  </View>
                }
                title={playlist.name}
              />
            ))}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

function resolveImages(images?: string[], image?: string) {
  if (images && images.length > 0) {
    return images
  }

  return image ? [image] : undefined
}

function PickerRow({
  onPress,
  leading,
  title,
}: {
  onPress: () => void
  leading: React.ReactNode
  title: string
}) {
  return (
    <PressableFeedback
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl p-2 active:bg-surface/60"
    >
      {leading}
      <Text className="flex-1 text-base font-medium text-foreground" numberOfLines={1}>
        {title}
      </Text>
    </PressableFeedback>
  )
}

export default PlaylistPickerSheet
