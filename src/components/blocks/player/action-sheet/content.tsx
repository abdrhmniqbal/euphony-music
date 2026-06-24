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
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, Button, PressableFeedback, Slider, Switch } from "heroui-native"
import { useQueries } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Platform, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { PlayerActionMenu } from "./menu"
import {
  SleepTimerSection,
  type SleepTimerDraft,
  createSleepTimerDraft,
  buildDismissedCustomTimeDraft,
  getLockedMode,
  getSleepTimerSummary,
  formatClockValue,
} from "./sleep-timer-section"
import { ArtistPickerSheet } from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { getArtistByName } from "@/modules/library/repository"
import { usePlayerQueue, useSleepTimerState } from "@/modules/player/selectors"
import {
  clearSleepTimer,
  setSleepTimerClock,
  setSleepTimerMinutes,
  setSleepTimerPlayCount,
  setSleepTimerTrackEnd,
} from "@/modules/player/sleep-timer"
import { usePlaylistPickerSelection } from "@/modules/playlist/use-picker-selection"
import { showAppToast } from "@/modules/ui/toast"
import { setPlaylistFormDraft } from "@/modules/playlist/form-draft-store"

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

export function PlayerActionSheet({
  visible,
  onOpenChange,
  track,
  artistNames,
  onNavigate,
}: PlayerActionSheetProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const queue = usePlayerQueue()
  const sleepTimer = useSleepTimerState()
  const canUseLibraryActions = Boolean(track && track.isExternal !== true)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [sleepTimerDraft, setSleepTimerDraft] = useState(() => createSleepTimerDraft(sleepTimer))
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
            new Set(artistNames.map((name) => name.trim()).filter((name) => name.length > 0))
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
      buildArtistPickerItems(artistPickerSource, artistNames, (count) =>
        t("library.count.track", { count })
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
    showAppToast(title, description)
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

  const handleCustomTimePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setSleepTimerDraft((draft) => ({
        ...draft,
        showCustomTimePicker: false,
      }))
    }

    if (event.type === "dismissed" || !selectedDate) {
      setSleepTimerDraft((draft) => buildDismissedCustomTimeDraft(sleepTimer, draft))
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
    const normalized = artistNames.map((name) => name.trim()).filter((name) => name.length > 0)

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
    const queueTrackIds =
      queue.length > 0 ? queue : track && track.isExternal !== true ? [track.id] : []

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

  if (!track || !canUseLibraryActions) {
    return null
  }

  return (
    <>
      <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <PlayerActionMenu
            sleepTimerSummary={sleepTimerSummary}
            labels={{
              sleepTimer: t("player.sleepTimer.title"),
              goToArtist: t("player.menu.goToArtist"),
              goToAlbum: t("player.menu.goToAlbum"),
              addToPlaylist: t("track.addToPlaylist"),
              saveQueueToPlaylist: t("playlist.saveQueueToPlaylist"),
            }}
            onOpenSleepTimer={handleOpenSleepTimerSheet}
            onOpenArtistChooser={handleOpenArtistChooser}
            onOpenAlbum={handleOpenAlbum}
            onOpenPlaylistPicker={handleOpenPlaylistPicker}
            onSaveQueueToPlaylist={handleSaveQueueToPlaylist}
          />
        </BottomSheet.Portal>
      </BottomSheet>

      <SleepTimerSection
        isOpen={isSleepTimerOpen}
        onOpenChange={setIsSleepTimerOpen}
        labels={{
          title: t("player.sleepTimer.title"),
          timer: t("player.sleepTimer.timer"),
          timerDescription: t("player.sleepTimer.timerDescription"),
          timerValue: t("player.sleepTimer.timerValue"),
          timerValueMinutes: t("player.sleepTimer.timerValueMinutes"),
          playCount: t("player.sleepTimer.playCount"),
          playCountDescription: t("player.sleepTimer.playCountDescription"),
          playCountValueLabel: t("player.sleepTimer.playCountValueLabel"),
          playCountValue: t("player.sleepTimer.playCountValue"),
          endOfCurrentTrack: t("player.sleepTimer.endOfCurrentTrack"),
          endOfCurrentTrackDescription: t("player.sleepTimer.endOfCurrentTrackDescription"),
          customTime: t("player.sleepTimer.customTime"),
          cancelTimer: t("player.sleepTimer.cancelTimer"),
          off: t("player.sleepTimer.off"),
        }}
        customTimeDescription={customTimeDescription}
        customTimeDate={customTimeDate}
        showCustomTimePicker={showCustomTimePicker}
        timerMinutes={timerMinutes}
        playCount={playCount}
        endOfCurrentTrack={endOfCurrentTrack}
        lockedMode={lockedMode}
        setSleepTimerDraft={setSleepTimerDraft}
        handleOpenCustomTimePicker={handleOpenCustomTimePicker}
        handleCustomTimePickerChange={handleCustomTimePickerChange}
        clearSleepTimer={clearSleepTimer}
        setSleepTimerMinutes={setSleepTimerMinutes}
        setSleepTimerPlayCount={setSleepTimerPlayCount}
        setSleepTimerTrackEnd={setSleepTimerTrackEnd}
      />

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
