import { useMemo, useState } from "react"
import { Platform } from "react-native"
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker"

import {
  clearSleepTimer,
  setSleepTimerClock,
  setSleepTimerMinutes,
  setSleepTimerPlayCount,
  setSleepTimerTrackEnd,
} from "@/playback/sleep-timer"
import { useSleepTimerState } from "@/playback/selectors"

import {
  buildDismissedCustomTimeDraft,
  createSleepTimerDraft,
  formatClockValue,
  getLockedMode,
  getSleepTimerSummary,
  type SleepTimerDraft,
} from "./sleep-timer-section"

interface UseSleepTimerDraftReturn {
  draft: SleepTimerDraft
  setDraft: React.Dispatch<React.SetStateAction<SleepTimerDraft>>
  timerMinutes: number
  playCount: number
  endOfCurrentTrack: boolean
  showCustomTimePicker: boolean
  lockedMode: "minutes" | "playCount" | "trackEnd" | "clock" | null
  summary: string
  customTimeDescription: string
  customTimeDate: Date
  handleOpenCustomTimePicker: () => void
  handleCustomTimePickerChange: (event: DateTimePickerEvent, selectedDate?: Date) => void
  clearTimer: () => void
  commitTimerMinutes: (value: number) => void
  commitPlayCount: (value: number) => void
  commitTrackEnd: () => void
}

export function useSleepTimerDraft(
  t: (key: string, options?: Record<string, string | number>) => string
): UseSleepTimerDraftReturn {
  const sleepTimer = useSleepTimerState()
  const [draft, setDraft] = useState<SleepTimerDraft>(() => createSleepTimerDraft(sleepTimer))

  const {
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    customTimeEnabled,
    customHour,
    customMinute,
    showCustomTimePicker,
  } = draft

  const lockedMode = getLockedMode({
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    customTimeEnabled,
  })

  const customTimeDate = useMemo(() => {
    const date = new Date()
    date.setHours(customHour, customMinute, 0, 0)
    return date
  }, [customHour, customMinute])

  const summary = useMemo(
    () =>
      getSleepTimerSummary(
        t,
        sleepTimer.mode,
        sleepTimer.minutes,
        sleepTimer.playCount,
        sleepTimer.clockHour,
        sleepTimer.clockMinute
      ),
    [
      sleepTimer.clockHour,
      sleepTimer.clockMinute,
      sleepTimer.minutes,
      sleepTimer.mode,
      sleepTimer.playCount,
      t,
    ]
  )

  const customTimeDescription = customTimeEnabled
    ? t("player.sleepTimer.customTimeDescriptionUntil", {
        value: formatClockValue(customHour, customMinute),
        defaultValue: `Stop playback at ${formatClockValue(customHour, customMinute)}.`,
      })
    : t("player.sleepTimer.customTimeDescription")

  const handleOpenCustomTimePicker = () => {
    setDraft((prev) => ({
      ...prev,
      timerMinutes: 0,
      playCount: 0,
      endOfCurrentTrack: false,
      customTimeEnabled: true,
      showCustomTimePicker: true,
    }))
  }

  const handleCustomTimePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setDraft((prev) => ({
        ...prev,
        showCustomTimePicker: false,
      }))
    }

    if (event.type === "dismissed" || !selectedDate) {
      setDraft((prev) => buildDismissedCustomTimeDraft(sleepTimer, prev))
      return
    }

    const nextHour = selectedDate.getHours()
    const nextMinute = selectedDate.getMinutes()

    setDraft((prev) => ({
      ...prev,
      timerMinutes: 0,
      playCount: 0,
      endOfCurrentTrack: false,
      customTimeEnabled: true,
      customHour: nextHour,
      customMinute: nextMinute,
    }))
    setSleepTimerClock(nextHour, nextMinute)
  }

  const clearTimer = () => {
    clearSleepTimer()
  }

  const commitTimerMinutes = (value: number) => {
    setDraft((prev) => ({
      ...prev,
      timerMinutes: value,
      playCount: 0,
      endOfCurrentTrack: false,
      customTimeEnabled: false,
      showCustomTimePicker: false,
    }))
    setSleepTimerMinutes(value)
  }

  const commitPlayCount = (value: number) => {
    setDraft((prev) => ({
      ...prev,
      timerMinutes: 0,
      playCount: value,
      endOfCurrentTrack: false,
      customTimeEnabled: false,
      showCustomTimePicker: false,
    }))
    setSleepTimerPlayCount(value)
  }

  const commitTrackEnd = () => {
    setDraft((prev) => ({
      ...prev,
      timerMinutes: 0,
      playCount: 0,
      endOfCurrentTrack: true,
      customTimeEnabled: false,
      showCustomTimePicker: false,
    }))
    setSleepTimerTrackEnd()
  }

  return {
    draft,
    setDraft,
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    showCustomTimePicker,
    lockedMode,
    summary,
    customTimeDescription,
    customTimeDate,
    handleOpenCustomTimePicker,
    handleCustomTimePickerChange,
    clearTimer,
    commitTimerMinutes,
    commitPlayCount,
    commitTrackEnd,
  }
}
