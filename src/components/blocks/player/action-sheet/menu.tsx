import { Text, View } from "react-native"
import { BottomSheet, PressableFeedback } from "heroui-native"

import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalPlaylist02SolidIcon from "@/components/icons/local/playlist-02-solid"
import LocalQueue01Icon from "@/components/icons/local/queue-01"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { useThemeColors } from "@/modules/ui/theme"
import LocalClockFadingIcon from "@/components/icons/local/clock-fading"
import LocalUserIcon from "@/components/icons/local/user"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalVynil02Icon from "@/components/icons/local/vynil-02"
import LocalPlaylist03Icon from "@/components/icons/local/playlist-03"
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
    </BottomSheet.Content>
  )
}
