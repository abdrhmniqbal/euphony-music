import { Button, Dialog } from "heroui-native"
import { View } from "react-native"
import { useTranslation } from "react-i18next"

interface DeletePlaylistDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeletePlaylistDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeletePlaylistDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4">
          <View className="gap-1.5">
            <Dialog.Title>{t("playlist.deleteTitle")}</Dialog.Title>
            <Dialog.Description>{t("playlist.deleteDescription")}</Dialog.Description>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" onPress={() => onOpenChange(false)} isDisabled={isDeleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onPress={onConfirm} isDisabled={isDeleting}>
              {t("playlist.deleteAction")}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
