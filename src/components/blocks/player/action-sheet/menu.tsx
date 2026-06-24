import { Text, View } from "react-native"
import { BottomSheet, PressableFeedback } from "heroui-native"

import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import LocalQueueIcon from "@/components/icons/local/queue"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { useThemeColors } from "@/modules/ui/theme"

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

interface MenuRowProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  trailing?: React.ReactNode
}

function MenuRow({ icon, label, onPress, trailing }: MenuRowProps) {
  return (
    <PressableFeedback
      className="h-14 flex-row items-center gap-3 active:opacity-50"
      onPress={onPress}
    >
      <View className="w-6 items-center justify-center">{icon}</View>
      <Text className="flex-1 text-base font-medium text-foreground">{label}</Text>
      {trailing ? <View>{trailing}</View> : null}
    </PressableFeedback>
  )
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
  const theme = useThemeColors()

  return (
    <BottomSheet.Content backgroundClassName="bg-surface" className="gap-1">
      <MenuRow
        icon={<LocalClockSolidIcon fill="none" width={20} height={20} color={theme.muted} />}
        label={labels.sleepTimer}
        onPress={onOpenSleepTimer}
        trailing={<Text className="text-sm text-muted">{sleepTimerSummary}</Text>}
      />
      <MenuRow
        icon={<LocalUserSolidIcon fill="none" width={20} height={20} color={theme.muted} />}
        label={labels.goToArtist}
        onPress={onOpenArtistChooser}
      />
      <MenuRow
        icon={<LocalMusicNoteSolidIcon fill="none" width={20} height={20} color={theme.muted} />}
        label={labels.goToAlbum}
        onPress={onOpenAlbum}
      />
      <MenuRow
        icon={<LocalPlaylistSolidIcon fill="none" width={20} height={20} color={theme.muted} />}
        label={labels.addToPlaylist}
        onPress={onOpenPlaylistPicker}
      />
      <MenuRow
        icon={<LocalQueueIcon fill="none" width={20} height={20} color={theme.muted} />}
        label={labels.saveQueueToPlaylist}
        onPress={onSaveQueueToPlaylist}
      />
    </BottomSheet.Content>
  )
}
