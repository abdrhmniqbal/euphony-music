import { Text } from "react-native"
import { useThemeColor } from "heroui-native"

import LocalClockFadingIcon from "@/components/icons/local/clock-fading"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import LocalUserIcon from "@/components/icons/local/user"
import LocalVynil02Icon from "@/components/icons/local/vynil-02"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"

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
  onAddToPlaylist: () => void
  onSaveQueueToPlaylist: () => void
}

export function PlayerActionMenu({
  sleepTimerSummary,
  labels,
  onOpenSleepTimer,
  onOpenArtistChooser,
  onOpenAlbum,
  onAddToPlaylist,
  onSaveQueueToPlaylist,
}: PlayerActionMenuProps) {
  const muted = useThemeColor("muted")

  return (
    <ActionSheet.Content className="gap-1">
      <MenuRow
        icon={<LocalClockFadingIcon fill="none" width={22} height={22} color={muted} />}
        label={labels.sleepTimer}
        onPress={onOpenSleepTimer}
        trailing={<Text className="text-sm text-muted">{sleepTimerSummary}</Text>}
      />
      <MenuRow
        icon={<LocalUserIcon fill="none" width={22} height={22} color={muted} />}
        label={labels.goToArtist}
        onPress={onOpenArtistChooser}
      />
      <MenuRow
        icon={<LocalVynil02Icon fill="none" width={22} height={22} color={muted} />}
        label={labels.goToAlbum}
        onPress={onOpenAlbum}
      />
      <MenuRow
        icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={muted} />}
        label={labels.addToPlaylist}
        onPress={onAddToPlaylist}
      />
      <MenuRow
        icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={muted} />}
        label={labels.saveQueueToPlaylist}
        onPress={onSaveQueueToPlaylist}
      />
    </ActionSheet.Content>
  )
}
