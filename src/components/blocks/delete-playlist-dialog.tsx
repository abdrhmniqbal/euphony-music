import { Button, Dialog } from "heroui-native";
import { View } from "react-native";

type DeletePlaylistDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export function DeletePlaylistDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeletePlaylistDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4">
          <View className="gap-1.5">
            <Dialog.Title>Delete playlist?</Dialog.Title>
            <Dialog.Description>
              This action cannot be undone. Your playlist and its track order
              will be removed.
            </Dialog.Description>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button
              variant="ghost"
              onPress={() => onOpenChange(false)}
              isDisabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={onConfirm}
              isDisabled={isDeleting}
            >
              Delete
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
