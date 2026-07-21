/**
 * Purpose: Renders indexed-track player quick actions plus sleep timer controls for the full player.
 * Caller: Player route.
 * Dependencies: HeroUI Native sheet components, router navigation, player queue selector, player sleep timer service/store, playlist form draft store, playlist picker flow, artist hydration, and reusable artist picker sheet.
 * Main Functions: PlayerActionSheet()
 * Side Effects: Navigates to artist/album routes, opens playlist picker workflows, preloads queue tracks into playlist creation, and updates player sleep timer state.
 */

import type { Track } from "@/modules/player/types"
import { useGuardedRouter as useRouter } from "@/modules/navigation"
import { ActionSheet } from "@/modules/shared/components/ui/action-sheet"
import { useQueries } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { PlayerActionMenu } from "./menu"
import { SleepTimerSection } from "./sleep-timer-section"
import { useSleepTimerDraft } from "./use-sleep-timer-draft"
import { ValueNavigationSheet } from "@/modules/library/ui/value-navigation-sheet"
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import { PlaylistPickerSheet } from "@/modules/playlist/ui/playlist-picker-sheet"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { getArtistByName } from "@/modules/library/repository"
import { usePlayerQueue } from "@/modules/player/selectors"
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
  const sleepTimerDraft = useSleepTimerDraft(t)
  const canUseLibraryActions = Boolean(track && track.isExternal !== true)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)

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

  const showPlaylistToast = (title: string, description?: string) => {
    showAppToast(title, description)
  }

  const handleOpenPlaylistPicker = () => {
    onOpenChange(false)
    setIsPlaylistPickerOpen(true)
  }

  const handleOpenSleepTimerSheet = () => {
    onOpenChange(false)
    setIsSleepTimerOpen(true)
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
      <ActionSheet.Root isOpen={visible} onOpenChange={onOpenChange}>
        <PlayerActionMenu
          sleepTimerSummary={sleepTimerDraft.summary}
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
      </ActionSheet.Root>

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

      <ValueNavigationSheet
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
