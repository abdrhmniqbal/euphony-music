import type { Track } from "@/modules/player/store"
import { Button, Dialog } from "heroui-native"

import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { useDeleteTrackFromDevice } from "@/modules/tracks/mutations"
import { showAppToast } from "@/modules/ui/toast"

interface DeleteTrackDialogProps {
  track: Track | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (track: Track) => void
}

export function DeleteTrackDialog({
  track,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeleteTrackDialogProps) {
  const { t } = useTranslation()
  const deleteTrackFromDeviceMutation = useDeleteTrackFromDevice()
  const isDeleting = deleteTrackFromDeviceMutation.isPending

  async function handleConfirmDelete() {
    if (!track || isDeleting) {
      return
    }

    try {
      const result = await deleteTrackFromDeviceMutation.mutateAsync({
        trackId: track.id,
        title: track.title,
      })

      if (result.status === "permission-denied") {
        showAppToast(t("track.permissionRequiredTitle"), t("track.permissionRequiredDescription"))
        return
      }

      if (result.status !== "deleted") {
        showAppToast(t("track.deleteFailedTitle"))
        return
      }

      onOpenChange(false)
      onDeleted?.(track)
      showAppToast(t("track.deletedTitle"), track.title)
    } catch {
      showAppToast(t("track.deleteFailedTitle"))
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4">
          <View className="gap-1.5">
            <Dialog.Title>{t("track.deleteTitle")}</Dialog.Title>
            <Dialog.Description>
              {t("track.deleteDescription", {
                title: track?.title || t("track.deleteFallbackTitle"),
              })}
            </Dialog.Description>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" onPress={() => onOpenChange(false)} isDisabled={isDeleting}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                void handleConfirmDelete()
              }}
              isDisabled={isDeleting}
            >
              {t("track.deleteAction")}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
