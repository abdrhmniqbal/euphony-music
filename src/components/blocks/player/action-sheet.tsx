/**
 * Purpose: Renders indexed-track player quick actions plus sleep timer controls for the full player.
 * Caller: Player route.
 * Dependencies: HeroUI Native sheet components, router navigation, player queue selector, player sleep timer service/store, playlist form draft store, playlist picker flow, artist hydration, and reusable artist picker sheet.
 * Main Functions: PlayerActionSheet()
 * Side Effects: Navigates to artist/album routes, opens playlist picker workflows, preloads queue tracks into playlist creation, and updates player sleep timer state.
 */

import type { SleepTimerMode, Track } from "@/modules/player/types"
import {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet"
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import {
  BottomSheet,
  Button,
  PressableFeedback,
  Slider,
  Switch,
  Toast,
  useToast,
} from "heroui-native"
import { useQueries } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Platform, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ArtistPickerSheet } from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/components/blocks/artist-picker.utils"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { getArtistByName } from "@/modules/library/repository"
import {
  usePlayerQueue,
  useSleepTimerState,
} from "@/modules/player/selectors"
import {
  clearSleepTimer,
  setSleepTimerClock,
  setSleepTimerMinutes,
  setSleepTimerPlayCount,
  setSleepTimerTrackEnd,
} from "@/modules/player/sleep-timer"
import { usePlaylistPickerSelection } from "@/modules/playlist/picker-selection.hook"
import { setPlaylistFormDraft } from "@/modules/playlist/form-draft.store"

interface ArtistPickerSourceArtist {
  name: string
  artwork: string | null
  trackCount: number
}

interface PlayerActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  track: Track | null
  artistNames: string[]
  onNavigate?: () => void
}

const TIMER_MINUTES_MAX = 180
const PLAY_COUNT_MAX = 15

interface SleepTimerDraft {
  timerMinutes: number
  playCount: number
  endOfCurrentTrack: boolean
  customTimeEnabled: boolean
  customHour: number
  customMinute: number
  showCustomTimePicker: boolean
}

function getSliderNumericValue(value: number | number[]) {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, "0")
}

function formatClockValue(hour: number, minute: number) {
  return `${padTimeUnit(hour)}:${padTimeUnit(minute)}`
}

function getSleepTimerSummary(
  t: ReturnType<typeof useTranslation>["t"],
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

  if (
    mode === "clock" &&
    clockHour !== null &&
    clockMinute !== null
  ) {
    return t("player.sleepTimer.customTimeValue", {
      value: formatClockValue(clockHour, clockMinute),
    })
  }

  return t("player.sleepTimer.off")
}

function getLockedMode({
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

function createSleepTimerDraft(
  sleepTimer: ReturnType<typeof useSleepTimerState>
): SleepTimerDraft {
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

function buildDismissedCustomTimeDraft(
  sleepTimer: ReturnType<typeof useSleepTimerState>,
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
        <Text className="text-base font-semibold text-foreground">
          {title}
        </Text>
        <Text className="text-sm text-muted">
          {description}
        </Text>
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
          <PressableFeedback
            onPress={onPress}
            className="active:opacity-50"
          >
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

export function PlayerActionSheet({
  visible,
  onOpenChange,
  track,
  artistNames,
  onNavigate,
}: PlayerActionSheetProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const queue = usePlayerQueue()
  const sleepTimer = useSleepTimerState()
  const canUseLibraryActions = Boolean(track && track.isExternal !== true)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [sleepTimerDraft, setSleepTimerDraft] = useState(() =>
    createSleepTimerDraft(sleepTimer)
  )
  const {
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    customTimeEnabled,
    customHour,
    customMinute,
    showCustomTimePicker,
  } = sleepTimerDraft

  const customTimeDate = useMemo(() => {
    const date = new Date()
    date.setHours(customHour, customMinute, 0, 0)
    return date
  }, [customHour, customMinute])

  const normalizedArtistNames = useMemo(
    () =>
      canUseLibraryActions
        ? Array.from(
            new Set(
              artistNames
                .map((name) => name.trim())
                .filter((name) => name.length > 0)
            )
          )
        : [],
    [artistNames, canUseLibraryActions]
  )

  const resolvedArtistQueries = useQueries({
    queries: normalizedArtistNames.map((name) => ({
      queryKey: ["artists", "name", name.toLowerCase()] as const,
      enabled: canUseLibraryActions && name.length > 0,
      queryFn: async () => await getArtistByName(name),
    })),
  })

  const resolvedArtists = useMemo<ArtistPickerSourceArtist[]>(
    () =>
      resolvedArtistQueries
        .map((query, index) => {
          const name = normalizedArtistNames[index]
          if (!name) {
            return null
          }

          return {
            name,
            artwork: query.data?.artwork || null,
            trackCount: query.data?.trackCount || 0,
          }
        })
        .filter((artist): artist is ArtistPickerSourceArtist => Boolean(artist)),
    [normalizedArtistNames, resolvedArtistQueries]
  )

  const artistPickerSource = useMemo(() => {
    const artistsByName = new Map(
      resolvedArtists.map((artist) => [artist.name.trim().toLowerCase(), artist])
    )

    const buildArtist = (name: string) => {
      const matchedArtist = artistsByName.get(name.trim().toLowerCase())

      return {
        name,
        artwork: matchedArtist?.artwork || null,
        trackCount: matchedArtist?.trackCount || 0,
      }
    }

    return {
      artist: artistNames[0] ? buildArtist(artistNames[0]) : null,
      featuredArtists: artistNames.slice(1).map((name) => ({
        artist: buildArtist(name),
      })),
    }
  }, [artistNames, resolvedArtists])

  const artistPickerItems = useMemo(
    () =>
      buildArtistPickerItems(
        artistPickerSource,
        artistNames,
        (count) => t("library.count.track", { count })
      ),
    [artistNames, artistPickerSource, t]
  )

  const sleepTimerSummary = useMemo(
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

  const lockedMode = getLockedMode({
    timerMinutes,
    playCount,
    endOfCurrentTrack,
    customTimeEnabled,
  })
  const customTimeDescription = customTimeEnabled
    ? t("player.sleepTimer.customTimeDescriptionUntil", {
        value: formatClockValue(customHour, customMinute),
        defaultValue: `Stop playback at ${formatClockValue(customHour, customMinute)}.`,
      })
    : t("player.sleepTimer.customTimeDescription")

  const showPlaylistToast = (title: string, description?: string) => {
    toast.show({
      duration: 1800,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          {description ? (
            <Toast.Description className="text-xs text-muted">
              {description}
            </Toast.Description>
          ) : null}
        </Toast>
      ),
    })
  }

  const handleOpenPlaylistPicker = () => {
    onOpenChange(false)
    setIsPlaylistPickerOpen(true)
  }

  const handleOpenSleepTimerSheet = () => {
    setSleepTimerDraft(createSleepTimerDraft(sleepTimer))
    onOpenChange(false)
    setIsSleepTimerOpen(true)
  }

  const handleOpenCustomTimePicker = () => {
    setSleepTimerDraft((draft) => ({
      ...draft,
      timerMinutes: 0,
      playCount: 0,
      endOfCurrentTrack: false,
      customTimeEnabled: true,
      showCustomTimePicker: true,
    }))
  }

  const handleCustomTimePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setSleepTimerDraft((draft) => ({
        ...draft,
        showCustomTimePicker: false,
      }))
    }

    if (event.type === "dismissed" || !selectedDate) {
      setSleepTimerDraft((draft) =>
        buildDismissedCustomTimeDraft(sleepTimer, draft)
      )
      return
    }

    const nextHour = selectedDate.getHours()
    const nextMinute = selectedDate.getMinutes()

    setSleepTimerDraft((draft) => ({
      ...draft,
      timerMinutes: 0,
      playCount: 0,
      endOfCurrentTrack: false,
      customTimeEnabled: true,
      customHour: nextHour,
      customMinute: nextMinute,
    }))
    setSleepTimerClock(nextHour, nextMinute)
  }

  const handleOpenArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsArtistSelectionOpen(false)
    setIsSleepTimerOpen(false)
    onNavigate?.()
    router.dismissTo({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
  }

  const handleOpenArtistChooser = () => {
    const normalized = artistNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsSleepTimerOpen(false)
    setIsArtistSelectionOpen(true)
  }

  const handleOpenAlbum = () => {
    const albumName = track?.album?.trim()
    if (!albumName) {
      return
    }

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsSleepTimerOpen(false)
    onNavigate?.()
    router.dismissTo({
      pathname: "/album/[name]",
      params: {
        name: albumName,
        transitionId: resolveAlbumTransitionId({
          id: track?.albumId,
          title: albumName,
        }),
      },
    })
  }

  const handleCreatePlaylist = () => {
    setIsPlaylistPickerOpen(false)
    router.push("/playlist/form")
  }

  const handleSaveQueueToPlaylist = () => {
    const queueTrackIds = Array.from(
      new Set(
        (queue.length > 0 ? queue : [track])
          .filter(
            (item): item is Track => item !== null && item.isExternal !== true
          )
          .map((item) => item.id)
      )
    )

    onOpenChange(false)
    setIsPlaylistPickerOpen(false)
    setIsArtistSelectionOpen(false)
    setIsSleepTimerOpen(false)
    setPlaylistFormDraft(queueTrackIds, "queue")
    onNavigate?.()
    router.dismissTo("/(main)/(library)/playlist/form")
  }

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: canUseLibraryActions ? track?.id : undefined,
    onSelectionApplied: () => {
      setIsPlaylistPickerOpen(false)
    },
    showPlaylistToast,
  })

  const renderSleepTimerFooter = (props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props}>
      <View className="bg-surface px-4 pb-safe-offset-3">
        <Button
          variant="danger"
          className="w-full"
          onPress={() => {
            clearSleepTimer()
            setIsSleepTimerOpen(false)
          }}
        >
          {t("player.sleepTimer.cancelTimer")}
        </Button>
      </View>
    </BottomSheetFooter>
  )

  if (!track || !canUseLibraryActions) {
    return null
  }

  return (
    <>
      <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            className="gap-1"
          >
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenSleepTimerSheet}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.sleepTimer.title")}
              </Text>
              <Text className="text-sm text-muted">
                {sleepTimerSummary}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenArtistChooser}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.menu.goToArtist")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenAlbum}
            >
              <Text className="text-base font-medium text-foreground">
                {t("player.menu.goToAlbum")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleOpenPlaylistPicker}
            >
              <Text className="text-base font-medium text-foreground">
                {t("track.addToPlaylist")}
              </Text>
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={handleSaveQueueToPlaylist}
            >
              <Text className="text-base font-medium text-foreground">
                {t("playlist.saveQueueToPlaylist")}
              </Text>
            </PressableFeedback>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={isSleepTimerOpen} onOpenChange={setIsSleepTimerOpen}>
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
              <BottomSheet.Title className="flex-1 text-xl">
                {t("player.sleepTimer.title")}
              </BottomSheet.Title>
              <BottomSheet.Close />
            </View>

            <BottomSheetScrollView
              contentContainerClassName="gap-3 px-4 pb-safe-offset-8"
              showsVerticalScrollIndicator={false}
            >
              <SleepTimerOption
                title={t("player.sleepTimer.timer")}
                description={t("player.sleepTimer.timerDescription")}
                disabled={lockedMode !== null && lockedMode !== "minutes"}
              >
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-foreground">
                      {t("player.sleepTimer.timerValue")}
                    </Text>
                    <Text className="text-sm text-muted">
                      {timerMinutes > 0
                        ? t("player.sleepTimer.timerValueMinutes", {
                            count: timerMinutes,
                          })
                        : t("player.sleepTimer.off")}
                    </Text>
                  </View>
                  <Slider
                    minValue={0}
                    maxValue={TIMER_MINUTES_MAX}
                    step={1}
                    value={timerMinutes}
                    onChange={(value) => {
                      setSleepTimerDraft((draft) => ({
                        ...draft,
                        timerMinutes: getSliderNumericValue(value),
                      }))
                    }}
                    onChangeEnd={(value) => {
                      const nextMinutes = getSliderNumericValue(value)
                      setSleepTimerDraft((draft) => ({
                        ...draft,
                        timerMinutes: nextMinutes,
                        playCount: 0,
                        endOfCurrentTrack: false,
                        customTimeEnabled: false,
                        showCustomTimePicker: false,
                      }))
                      setSleepTimerMinutes(nextMinutes)
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
                title={t("player.sleepTimer.playCount")}
                description={t("player.sleepTimer.playCountDescription")}
                disabled={lockedMode !== null && lockedMode !== "playCount"}
              >
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-foreground">
                      {t("player.sleepTimer.playCountValueLabel")}
                    </Text>
                    <Text className="text-sm text-muted">
                      {playCount > 0
                        ? t("player.sleepTimer.playCountValue", {
                            count: playCount,
                          })
                        : t("player.sleepTimer.off")}
                    </Text>
                  </View>
                  <Slider
                    minValue={0}
                    maxValue={PLAY_COUNT_MAX}
                    step={1}
                    value={playCount}
                    onChange={(value) => {
                      setSleepTimerDraft((draft) => ({
                        ...draft,
                        playCount: getSliderNumericValue(value),
                      }))
                    }}
                    onChangeEnd={(value) => {
                      const nextPlayCount = getSliderNumericValue(value)
                      setSleepTimerDraft((draft) => ({
                        ...draft,
                        timerMinutes: 0,
                        playCount: nextPlayCount,
                        endOfCurrentTrack: false,
                        customTimeEnabled: false,
                        showCustomTimePicker: false,
                      }))
                      setSleepTimerPlayCount(nextPlayCount)
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
                title={t("player.sleepTimer.endOfCurrentTrack")}
                description={t("player.sleepTimer.endOfCurrentTrackDescription")}
                disabled={lockedMode !== null && lockedMode !== "trackEnd"}
                suffix={
                  <Switch
                    isSelected={endOfCurrentTrack}
                    onSelectedChange={(isSelected) => {
                      if (!isSelected) {
                        setSleepTimerDraft((draft) => ({
                          ...draft,
                          endOfCurrentTrack: false,
                        }))
                        clearSleepTimer()
                        return
                      }

                      setSleepTimerDraft((draft) => ({
                        ...draft,
                        timerMinutes: 0,
                        playCount: 0,
                        endOfCurrentTrack: true,
                        customTimeEnabled: false,
                        showCustomTimePicker: false,
                      }))
                      setSleepTimerTrackEnd()
                    }}
                  />
                }
              />

              <SleepTimerOption
                title={t("player.sleepTimer.customTime")}
                description={customTimeDescription}
                disabled={lockedMode !== null && lockedMode !== "clock"}
                onPress={handleOpenCustomTimePicker}
                suffix={
                  <LocalChevronRightIcon
                    fill="none"
                    width={18}
                    height={18}
                    color="white"
                  />
                }
              >
                {showCustomTimePicker ? (
                  <View className="mt-2 items-stretch overflow-hidden rounded-lg">
                    <DateTimePicker
                      value={customTimeDate}
                      mode="time"
                      is24Hour
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleCustomTimePickerChange}
                    />
                  </View>
                ) : null}
              </SleepTimerOption>
            </BottomSheetScrollView>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onOpenChange={setIsPlaylistPickerOpen}
        trackId={track.id}
        isSelecting={isSelecting}
        onCreatePlaylist={handleCreatePlaylist}
        onSelectPlaylist={(playlist) => {
          void handleSelectPlaylist(playlist)
        }}
      />

      <ArtistPickerSheet
        isOpen={isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        items={artistPickerItems}
        onSelectValue={(value) => {
          handleOpenArtist(value)
        }}
      />
    </>
  )
}
