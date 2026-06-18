import { Text } from "react-native"
import { BottomSheet, PressableFeedback } from "heroui-native"

interface PlayerActionMenuProps {
  sleepTimerSummary: string
  labels: {
    sleepTimer: string
    goToArtist: string
    goToAlbum: string
    addToPlaylist: string
    saveQueueToPlaylist: string
  }
  onOpenSleepTimer: () => void
  onOpenArtistChooser: () => void
  onOpenAlbum: () => void
  onOpenPlaylistPicker: () => void
  onSaveQueueToPlaylist: () => void
}

export function PlayerActionMenu({
  sleepTimerSummary,
  labels,
  onOpenSleepTimer,
  onOpenArtistChooser,
  onOpenAlbum,
  onOpenPlaylistPicker,
  onSaveQueueToPlaylist,
}: PlayerActionMenuProps) {
  return (
    <BottomSheet.Content backgroundClassName="bg-surface" className="gap-1">
      <PressableFeedback
        className="h-14 flex-row items-center justify-between active:opacity-50"
        onPress={onOpenSleepTimer}
      >
        <Text className="text-base font-medium text-foreground">{labels.sleepTimer}</Text>
        <Text className="text-sm text-muted">{sleepTimerSummary}</Text>
      </PressableFeedback>
      <PressableFeedback
        className="h-14 flex-row items-center justify-between active:opacity-50"
        onPress={onOpenArtistChooser}
      >
        <Text className="text-base font-medium text-foreground">{labels.goToArtist}</Text>
      </PressableFeedback>
      <PressableFeedback
        className="h-14 flex-row items-center justify-between active:opacity-50"
        onPress={onOpenAlbum}
      >
        <Text className="text-base font-medium text-foreground">{labels.goToAlbum}</Text>
      </PressableFeedback>
      <PressableFeedback
        className="h-14 flex-row items-center justify-between active:opacity-50"
        onPress={onOpenPlaylistPicker}
      >
        <Text className="text-base font-medium text-foreground">{labels.addToPlaylist}</Text>
      </PressableFeedback>
      <PressableFeedback
        className="h-14 flex-row items-center justify-between active:opacity-50"
        onPress={onSaveQueueToPlaylist}
      >
        <Text className="text-base font-medium text-foreground">{labels.saveQueueToPlaylist}</Text>
      </PressableFeedback>
    </BottomSheet.Content>
  )
}
