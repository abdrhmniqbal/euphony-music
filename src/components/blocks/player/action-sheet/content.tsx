import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { PlayerTrack } from "@/playback/types"
import { ActionSheet } from "@/components/ui/action-sheet"
import { PlayerActionMenu } from "./menu"
import { SleepTimerSection } from "./sleep-timer-section"
import { useSleepTimerDraft } from "./use-sleep-timer-draft"

interface PlayerActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  track: PlayerTrack | null
}

export function PlayerActionSheet({ visible, onOpenChange, track }: PlayerActionSheetProps) {
  const { t } = useTranslation()
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const sleepTimerDraft = useSleepTimerDraft(t)

  if (!track) {
    return null
  }

  const handleOpenSleepTimerSheet = () => {
    onOpenChange(false)
    setIsSleepTimerOpen(true)
  }

  return (
    <>
      <ActionSheet.Root isOpen={visible} onOpenChange={onOpenChange}>
        <PlayerActionMenu
          sleepTimerSummary={sleepTimerDraft.summary}
          labels={{
            sleepTimer: t("player.sleepTimer.title"),
          }}
          onOpenSleepTimer={handleOpenSleepTimerSheet}
        />
      </ActionSheet.Root>

      <SleepTimerSection
        isOpen={isSleepTimerOpen}
        onOpenChange={setIsSleepTimerOpen}
        labels={{
          title: t("player.sleepTimer.title"),
          timer: t("player.sleepTimer.timer"),
          timerDescription: t("player.sleepTimer.timerDescription"),
          timerValue: t("player.sleepTimer.timerValue"),
          timerValueMinutes: t("player.sleepTimer.timerValueMinutes", {
            count: sleepTimerDraft.timerMinutes,
          }),
          playCount: t("player.sleepTimer.playCount"),
          playCountDescription: t("player.sleepTimer.playCountDescription"),
          playCountValueLabel: t("player.sleepTimer.playCountValueLabel"),
          playCountValue: t("player.sleepTimer.playCountValue", {
            count: sleepTimerDraft.playCount,
          }),
          endOfCurrentTrack: t("player.sleepTimer.endOfCurrentTrack"),
          endOfCurrentTrackDescription: t("player.sleepTimer.endOfCurrentTrackDescription"),
          customTime: t("player.sleepTimer.customTime"),
          cancelTimer: t("player.sleepTimer.cancelTimer"),
          off: t("player.sleepTimer.off"),
        }}
        draftState={{
          timerMinutes: sleepTimerDraft.timerMinutes,
          playCount: sleepTimerDraft.playCount,
          endOfCurrentTrack: sleepTimerDraft.endOfCurrentTrack,
          showCustomTimePicker: sleepTimerDraft.showCustomTimePicker,
          customTimeDescription: sleepTimerDraft.customTimeDescription,
          customTimeDate: sleepTimerDraft.customTimeDate,
          lockedMode: sleepTimerDraft.lockedMode,
        }}
        callbacks={{
          onUpdateDraft: sleepTimerDraft.setDraft,
          onOpenCustomTimePicker: sleepTimerDraft.handleOpenCustomTimePicker,
          onCustomTimePickerChange: sleepTimerDraft.handleCustomTimePickerChange,
          onClearTimer: sleepTimerDraft.clearTimer,
          onCommitTimerMinutes: sleepTimerDraft.commitTimerMinutes,
          onCommitPlayCount: sleepTimerDraft.commitPlayCount,
          onCommitTrackEnd: sleepTimerDraft.commitTrackEnd,
        }}
      />
    </>
  )
}
