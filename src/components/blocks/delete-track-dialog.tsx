import type { Track } from "@/modules/player/store"
import { Button, Dialog, Toast, useToast } from "heroui-native"

import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { useDeleteTrackFromDevice } from "@/modules/tracks/mutations"

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
  const { toast } = useToast()
  const { t } = useTranslation()
  const deleteTrackFromDeviceMutation = useDeleteTrackFromDevice()
  const isDeleting = deleteTrackFromDeviceMutation.isPending

  function showToast(title: string, description?: string) {
    toast.show({
      duration: 1800,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          {description ? (
            <Toast.Description className="text-xs text-muted">{description}</Toast.Description>
          ) : null}
        </Toast>
      ),
    })
  }

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
        showToast(t("track.permissionRequiredTitle"), t("track.permissionRequiredDescription"))
        return
      }

      if (result.status !== "deleted") {
        showToast(t("track.deleteFailedTitle"))
        return
      }

      onOpenChange(false)
      onDeleted?.(track)
      showToast(t("track.deletedTitle"), track.title)
    } catch {
      showToast(t("track.deleteFailedTitle"))
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
