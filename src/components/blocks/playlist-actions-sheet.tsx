import { BottomSheet, PressableFeedback } from "heroui-native"
import { Text } from "react-native"

interface PlaylistActionsSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function PlaylistActionsSheet({
  visible,
  onOpenChange,
  onEdit,
  onDelete,
}: PlaylistActionsSheetProps) {
  function handleEditPress() {
    onOpenChange(false)
    onEdit()
  }

  function handleDeletePress() {
    onOpenChange(false)
    onDelete()
  }

  return (
    <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content backgroundClassName="bg-surface" className="gap-1">
          <PressableFeedback
            className="h-14 flex-row items-center justify-between active:opacity-50"
            onPress={handleEditPress}
          >
            <Text className="text-base font-medium text-foreground">
              Edit Playlist
            </Text>
          </PressableFeedback>
          <PressableFeedback
            className="h-14 flex-row items-center justify-between active:opacity-50"
            onPress={handleDeletePress}
          >
            <Text className="text-base font-medium text-danger">
              Delete Playlist
            </Text>
          </PressableFeedback>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
