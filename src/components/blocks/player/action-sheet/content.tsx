import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { PlayerTrack } from "@/playback/types"
import { useCurrentTrackId, usePlayerTracks } from "@/playback/selectors"
import { ActionSheet } from "@/components/ui/action-sheet"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { ValueNavigationSheet } from "@/components/blocks/value-navigation-sheet"
import { setPlaylistFormDraft } from "@/domains/playlists/form-draft-store"
import { splitArtistsValue } from "@/domains/tracks/split-engine"
import { getPreferenceState } from "@/core/preferences/store"
import { useGuardedRouter } from "@/core/navigation"
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
  const router = useGuardedRouter()
  const currentTrackId = useCurrentTrackId()
  const queueTracks = usePlayerTracks()
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const sleepTimerDraft = useSleepTimerDraft(t)

  const artistNames = useMemo(() => {
    if (!track?.artist) {
      return []
    }
    const source = track.rawArtistName || track.artistName || track.artist
    return Array.from(
      new Set(splitArtistsValue(source, getPreferenceState().splitMultipleValueConfig))
    )
  }, [track])

  if (!track) {
    return null
  }

  const handleOpenSleepTimerSheet = () => {
    onOpenChange(false)
    setIsSleepTimerOpen(true)
  }

  const handleAddToPlaylist = () => {
    onOpenChange(false)
    setIsPlaylistPickerOpen(true)
  }

  const handleSaveQueueToPlaylist = () => {
    onOpenChange(false)
    setPlaylistFormDraft(
      queueTracks.map((queueTrack) => queueTrack.id),
      "queue"
    )
    router.push("/playlist/form")
  }

  const handleOpenArtist = (name: string) => {
    const normalized = name.trim()
    if (!normalized) {
      return
    }
    setIsArtistSelectionOpen(false)
    router.push({ pathname: "/artist/[name]", params: { name: normalized } })
  }

  const handleOpenArtistChooser = () => {
    const normalized = artistNames.map((name) => name.trim()).filter((name) => name.length > 0)
    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0])
      return
    }
    onOpenChange(false)
    setIsArtistSelectionOpen(true)
  }

  const handleOpenAlbum = () => {
    const albumName = track.album?.trim()
    if (!albumName) {
      return
    }
    router.push({ pathname: "/album/[name]", params: { name: albumName } })
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
          onAddToPlaylist={handleAddToPlaylist}
          onSaveQueueToPlaylist={handleSaveQueueToPlaylist}
        />
      </ActionSheet.Root>

      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onClose={() => setIsPlaylistPickerOpen(false)}
        trackIds={currentTrackId ? [currentTrackId] : []}
      />
      <ValueNavigationSheet
        isOpen={isArtistSelectionOpen}
        title={t("player.menu.goToArtist")}
        values={artistNames}
        onOpenChange={setIsArtistSelectionOpen}
        onSelectValue={handleOpenArtist}
      />

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
