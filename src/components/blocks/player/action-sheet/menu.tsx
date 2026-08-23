import { Text } from "react-native"

import LocalClockFadingIcon from "@/components/icons/local/clock-fading"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { useThemeColors } from "@/core/theme/use-theme-colors"

interface PlayerActionMenuProps {
  sleepTimerSummary: string
  labels: {
    sleepTimer: string
  }
  onOpenSleepTimer: () => void
}

// Artist/album/playlist menu entries land with the detail screens and
// collections phases (P7/P8).
export function PlayerActionMenu({
  sleepTimerSummary,
  labels,
  onOpenSleepTimer,
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
    </ActionSheet.Content>
  )
}
