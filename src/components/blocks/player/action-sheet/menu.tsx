import { Text } from "react-native"
import { MenuRow } from "@/components/ui/menu-row"
import { ActionSheet } from "@/components/ui/action-sheet"
import { useThemeColors } from "@/modules/ui/theme"
import LocalClockFadingIcon from "@/components/icons/local/clock-fading"
import LocalUserIcon from "@/components/icons/local/user"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalVynil02Icon from "@/components/icons/local/vynil-02"
import LocalAddCircleIcon from "@/components/icons/local/add-circle"

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
  const theme = useThemeColors()

  return (
    <ActionSheet.Content className="gap-1">
      <MenuRow
        icon={<LocalClockFadingIcon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.sleepTimer}
        onPress={onOpenSleepTimer}
        trailing={<Text className="text-sm text-muted">{sleepTimerSummary}</Text>}
      />
      <MenuRow
        icon={<LocalUserIcon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.goToArtist}
        onPress={onOpenArtistChooser}
      />
      <MenuRow
        icon={<LocalVynil02Icon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.goToAlbum}
        onPress={onOpenAlbum}
      />
      <MenuRow
        icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.addToPlaylist}
        onPress={onOpenPlaylistPicker}
      />
      <MenuRow
        icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.saveQueueToPlaylist}
        onPress={onSaveQueueToPlaylist}
      />
    </ActionSheet.Content>
  )
}
