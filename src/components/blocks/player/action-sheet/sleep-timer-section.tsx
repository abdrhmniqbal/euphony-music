import {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { BottomSheet, Button, PressableFeedback, Slider, Switch } from "heroui-native"
import * as React from "react"
import { Platform, Text, View } from "react-native"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import type { SleepTimerMode } from "@/playback/types"

export const TIMER_MINUTES_MAX = 180
export const PLAY_COUNT_MAX = 15

export interface SleepTimerDraft {
  timerMinutes: number
  playCount: number
  endOfCurrentTrack: boolean
  customTimeEnabled: boolean
  customHour: number
  customMinute: number
  showCustomTimePicker: boolean
}

export function getSliderNumericValue(value: number | number[]) {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, "0")
}

export function formatClockValue(hour: number, minute: number) {
  return `${padTimeUnit(hour)}:${padTimeUnit(minute)}`
}

export function getSleepTimerSummary(
  t: (key: string, options?: Record<string, unknown>) => string,
  mode: SleepTimerMode,
  minutes: number,
  playCount: number,
  clockHour: number | null,
  clockMinute: number | null
) {
  if (mode === "minutes" && minutes > 0) {
    return t("player.sleepTimer.timerValueMinutes", { count: minutes })
  }

  if (mode === "playCount" && playCount > 0) {
    return t("player.sleepTimer.playCountValue", { count: playCount })
  }

  if (mode === "trackEnd") {
    return t("player.sleepTimer.endOfCurrentTrack")
  }

  if (mode === "clock" && clockHour !== null && clockMinute !== null) {
    return t("player.sleepTimer.customTimeValue", {
      value: formatClockValue(clockHour, clockMinute),
    })
  }

  return t("player.sleepTimer.off")
}

export function getLockedMode({
  timerMinutes,
  playCount,
  endOfCurrentTrack,
  customTimeEnabled,
}: {
  timerMinutes: number
  playCount: number
  endOfCurrentTrack: boolean
  customTimeEnabled: boolean
}) {
  if (timerMinutes > 0) {
    return "minutes" as const
  }

  if (playCount > 0) {
    return "playCount" as const
  }

  if (endOfCurrentTrack) {
    return "trackEnd" as const
  }

  if (customTimeEnabled) {
    return "clock" as const
  }

  return null
}

export function createSleepTimerDraft(sleepTimer: {
  mode: SleepTimerMode
  minutes: number
  playCount: number
  clockHour: number | null
  clockMinute: number | null
}): SleepTimerDraft {
  const now = new Date()

  return {
    timerMinutes: sleepTimer.mode === "minutes" ? sleepTimer.minutes : 0,
    playCount: sleepTimer.mode === "playCount" ? sleepTimer.playCount : 0,
    endOfCurrentTrack: sleepTimer.mode === "trackEnd",
    customTimeEnabled: sleepTimer.mode === "clock",
    customHour:
      sleepTimer.mode === "clock" && sleepTimer.clockHour !== null
        ? sleepTimer.clockHour
        : now.getHours(),
    customMinute:
      sleepTimer.mode === "clock" && sleepTimer.clockMinute !== null
        ? sleepTimer.clockMinute
        : now.getMinutes(),
    showCustomTimePicker: sleepTimer.mode === "clock" && Platform.OS === "ios",
  }
}

export function buildDismissedCustomTimeDraft(
  sleepTimer: {
    mode: SleepTimerMode
    clockHour: number | null
    clockMinute: number | null
  },
  previousDraft: SleepTimerDraft
): SleepTimerDraft {
  const now = new Date()
  const fallbackHour =
    sleepTimer.mode === "clock" && sleepTimer.clockHour !== null
      ? sleepTimer.clockHour
      : now.getHours()
  const fallbackMinute =
    sleepTimer.mode === "clock" && sleepTimer.clockMinute !== null
      ? sleepTimer.clockMinute
      : now.getMinutes()

  return {
    ...previousDraft,
    customTimeEnabled: sleepTimer.mode === "clock",
    customHour: fallbackHour,
    customMinute: fallbackMinute,
    showCustomTimePicker: false,
  }
}

function SleepTimerOption({
  title,
  description,
  disabled,
  onPress,
  suffix,
  children,
}: {
  title: string
  description: string
  disabled: boolean
  onPress?: () => void
  suffix?: React.ReactNode
  children?: React.ReactNode
}) {
  const header = (
    <View className="flex-row items-center justify-between gap-4">
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted">{description}</Text>
      </View>
      {suffix ? <View className="shrink-0">{suffix}</View> : null}
    </View>
  )

  return (
    <View
      className={`w-full ${disabled ? "opacity-45" : ""}`}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <View className="w-full gap-2 rounded-lg px-1 py-2">
        {onPress ? (
          <PressableFeedback onPress={onPress} className="active:opacity-50">
            {header}
          </PressableFeedback>
        ) : (
          header
        )}
        {children}
      </View>
    </View>
  )
}

interface SleepTimerSectionProps {
  isOpen: boolean
  onOpenChange: (value: boolean) => void
  labels: Record<string, string>
  draftState: {
    timerMinutes: number
    playCount: number
    endOfCurrentTrack: boolean
    showCustomTimePicker: boolean
    customTimeDescription: string
    customTimeDate: Date
    lockedMode: "minutes" | "playCount" | "trackEnd" | "clock" | null
  }
  callbacks: {
    onUpdateDraft: React.Dispatch<React.SetStateAction<SleepTimerDraft>>
    onOpenCustomTimePicker: () => void
    onCustomTimePickerChange: (event: DateTimePickerEvent, selectedDate?: Date) => void
    onClearTimer: () => void
    onCommitTimerMinutes: (value: number) => void
    onCommitPlayCount: (value: number) => void
    onCommitTrackEnd: () => void
  }
}

export function SleepTimerSection({
  isOpen,
  onOpenChange,
  labels,
  draftState,
  callbacks,
}: SleepTimerSectionProps) {
  const {
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    showCustomTimePicker,
    customTimeDescription,
    customTimeDate,
    lockedMode,
  } = draftState
  const {
    onUpdateDraft,
    onOpenCustomTimePicker,
    onCustomTimePickerChange,
    onClearTimer,
    onCommitTimerMinutes,
    onCommitPlayCount,
    onCommitTrackEnd,
  } = callbacks
  const renderSleepTimerFooter = (props: BottomSheetFooterProps) => (
    <SleepTimerFooter
      {...props}
      clearSleepTimer={onClearTimer}
      onClose={() => onOpenChange(false)}
      label={labels.cancelTimer}
    />
  )

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["72%"]}
          enableDynamicSizing={false}
          enableOverDrag={false}
          footerComponent={renderSleepTimerFooter}
          backgroundClassName="bg-surface"
          contentContainerClassName="h-full px-0"
          className="w-full gap-2 self-stretch"
        >
          <View className="flex-row items-center justify-between gap-4 px-4 pb-2">
            <BottomSheet.Title className="flex-1 text-xl">{labels.title}</BottomSheet.Title>
          </View>

          <BottomSheetScrollView
            contentContainerClassName="gap-3 px-4 pb-safe-offset-8"
            showsVerticalScrollIndicator={false}
          >
            <SleepTimerOption
              title={labels.timer}
              description={labels.timerDescription}
              disabled={lockedMode !== null && lockedMode !== "minutes"}
            >
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">{labels.timerValue}</Text>
                  <Text className="text-sm text-muted">
                    {timerMinutes > 0
                      ? labels.timerValueMinutes.replace("{{count}}", String(timerMinutes))
                      : labels.off}
                  </Text>
                </View>
                <Slider
                  minValue={0}
                  maxValue={TIMER_MINUTES_MAX}
                  step={1}
                  value={timerMinutes}
                  onChange={(value) => {
                    onUpdateDraft((draft) => ({
                      ...draft,
                      timerMinutes: getSliderNumericValue(value),
                    }))
                  }}
                  onChangeEnd={(value) => {
                    const nextMinutes = getSliderNumericValue(value)
                    onCommitTimerMinutes(nextMinutes)
                  }}
                >
                  <Slider.Track className="h-2 rounded-full bg-border">
                    <Slider.Fill className="rounded-full bg-accent" />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </View>
            </SleepTimerOption>

            <SleepTimerOption
              title={labels.playCount}
              description={labels.playCountDescription}
              disabled={lockedMode !== null && lockedMode !== "playCount"}
            >
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    {labels.playCountValueLabel}
                  </Text>
                  <Text className="text-sm text-muted">
                    {playCount > 0
                      ? labels.playCountValue.replace("{{count}}", String(playCount))
                      : labels.off}
                  </Text>
                </View>
                <Slider
                  minValue={0}
                  maxValue={PLAY_COUNT_MAX}
                  step={1}
                  value={playCount}
                  onChange={(value) => {
                    onUpdateDraft((draft) => ({
                      ...draft,
                      playCount: getSliderNumericValue(value),
                    }))
                  }}
                  onChangeEnd={(value) => {
                    const nextPlayCount = getSliderNumericValue(value)
                    onCommitPlayCount(nextPlayCount)
                  }}
                >
                  <Slider.Track className="h-2 rounded-full bg-border">
                    <Slider.Fill className="rounded-full bg-accent" />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </View>
            </SleepTimerOption>

            <SleepTimerOption
              title={labels.endOfCurrentTrack}
              description={labels.endOfCurrentTrackDescription}
              disabled={lockedMode !== null && lockedMode !== "trackEnd"}
              suffix={
                <Switch
                  isSelected={endOfCurrentTrack}
                  onSelectedChange={(isSelected) => {
                    if (!isSelected) {
                      onUpdateDraft((draft) => ({ ...draft, endOfCurrentTrack: false }))
                      onClearTimer()
                      return
                    }

                    onCommitTrackEnd()
                  }}
                />
              }
            />

            <SleepTimerOption
              title={labels.customTime}
              description={customTimeDescription}
              disabled={lockedMode !== null && lockedMode !== "clock"}
              onPress={onOpenCustomTimePicker}
              suffix={<LocalChevronRightIcon fill="none" width={18} height={18} color="white" />}
            >
              {showCustomTimePicker ? (
                <View className="mt-2 items-stretch overflow-hidden rounded-lg">
                  <DateTimePicker
                    value={customTimeDate}
                    mode="time"
                    is24Hour
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onCustomTimePickerChange}
                  />
                </View>
              ) : null}
            </SleepTimerOption>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

function SleepTimerFooter({
  clearSleepTimer,
  onClose,
  label,
  ...props
}: BottomSheetFooterProps & {
  clearSleepTimer: () => void
  onClose: () => void
  label: string
}) {
  return (
    <BottomSheetFooter {...props}>
      <View className="bg-surface px-4 pb-safe-offset-3">
        <Button
          variant="danger"
          className="w-full"
          onPress={() => {
            clearSleepTimer()
            onClose()
          }}
        >
          {label}
        </Button>
      </View>
    </BottomSheetFooter>
  )
}
