import { Text } from "react-native"

import LocalClockFadingIcon from "@/components/icons/local/clock-fading"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { useThemeColors } from "@/core/theme/use-theme-colors"

interface PlayerActionMenuProps {
  sleepTimerSummary: string
  labels: {
    sleepTimer: string
    addToPlaylist: string
    saveQueueToPlaylist: string
  }
  onOpenSleepTimer: () => void
  onAddToPlaylist: () => void
  onSaveQueueToPlaylist: () => void
}

export function PlayerActionMenu({
  sleepTimerSummary,
  labels,
  onOpenSleepTimer,
  onAddToPlaylist,
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
        icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.addToPlaylist}
        onPress={onAddToPlaylist}
      />
      <MenuRow
        icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={theme.muted} />}
        label={labels.saveQueueToPlaylist}
        onPress={onSaveQueueToPlaylist}
      />
    </ActionSheet.Content>
  )
}
