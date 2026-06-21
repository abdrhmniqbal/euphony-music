import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { initializeTrackPlayer, registerPlaybackService } from "@/core/audio/track-player-service"
import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadInitialDatabaseState } from "@/modules/bootstrap/database-startup"
import { ensureLoggingInitialized } from "@/modules/bootstrap/runtime"
import { startIndexing } from "@/modules/indexer/service"
import { logError, logInfo } from "@/modules/logging/service"
import { ensureLoggingConfigLoaded } from "@/modules/logging/store"
import { subscribePlaybackStoreToPlayerStore } from "@/modules/player/playback-subscriber"
import { handlePlaybackProgress, handleTrackChanged as handleLastFmTrackChanged } from "@/modules/player/lastfm-scrobbler"
import { playNext, pauseTrack, resumeTrack, playPrevious, seekTo } from "@/modules/player/controls"
import {
  evaluateSleepTimerOnProgress,
  handleSleepTimerPlaybackEnded,
  handleSleepTimerTrackChanged,
} from "@/modules/player/sleep-timer"
import { ensureAppUpdateConfigLoaded } from "@/modules/settings/app-updates"
import { ensureCrossfadeConfigLoaded } from "@/modules/settings/audio-crossfade"
import {
  handleCrossfadePlaybackState,
  handleCrossfadeProgress,
  handleCrossfadeTrackActivated,
} from "@/modules/player/crossfade"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import { ensureAutoScanConfigLoaded } from "@/modules/settings/auto-scan"
import { ensureCountAsPlayedConfigLoaded } from "@/modules/settings/count-as-played"
import { ensureFolderFilterConfigLoaded } from "@/modules/settings/folder-filters"
import { ensureIndexerNotificationsConfigLoaded } from "@/modules/settings/indexer-notifications"
import { ensureSplitMultipleValueConfigLoaded } from "@/modules/settings/split-multiple-values"
import { ensureTrackDurationFilterConfigLoaded } from "@/modules/settings/track-duration-filter"
import { ensureThemeConfigLoaded } from "@/modules/settings/theme"
import { ensureAutoBackupConfigLoaded } from "@/modules/settings/auto-backup"
import { updateSettingsState } from "@/modules/settings/store"
import AudioBrowser from "react-native-audio-browser"

import { addPlayedTrack } from "@/modules/history/repository"
import { queryClient } from "@/lib/tanstack-query"
import { invalidateTrackQueries } from "@/modules/tracks/keys"
import { canStartIndexingNow } from "@/modules/bootstrap/utils"
import { playbackStore, usePlaybackStore } from "@/stores/playback/store"
import { preferenceStore, usePreferenceStore } from "@/stores/preference/store"
import { useViewPreferenceStore } from "@/stores/view-preference/store"

type RuntimeStatus = "loading" | "ready" | "error"

async function preloadSettings() {
  await Promise.all([
    ensureAutoScanConfigLoaded(),
    ensureAudioPlaybackConfigLoaded(),
    ensureAppUpdateConfigLoaded(),
    ensureCountAsPlayedConfigLoaded(),
    ensureCrossfadeConfigLoaded(),
    ensureFolderFilterConfigLoaded(),
    ensureIndexerNotificationsConfigLoaded(),
    ensureLoggingConfigLoaded(),
    ensureSplitMultipleValueConfigLoaded(),
    ensureThemeConfigLoaded(),
    ensureTrackDurationFilterConfigLoaded(),
    ensureAutoBackupConfigLoaded(),
  ])
  updateSettingsState({ _hasHydrated: true })
}

async function runStartupScan() {
  if (!preferenceStore.getState().rescanOnLaunch) {
    return
  }

  const canScan = await canStartIndexingNow({ initialScanOnly: true })
  if (!canScan) {
    logInfo("Startup scan skipped because conditions are not met")
    return
  }

  await startIndexing(false, false)
}

let playCountTimeout: ReturnType<typeof setTimeout> | null = null
let lastAutoAdvanceAt = 0
let lastSleepTimerTrackId: string | null = null

function advanceToNextTrackOnce() {
  const now = Date.now()
  if (now - lastAutoAdvanceAt < 1000) {
    return
  }

  lastAutoAdvanceAt = now
  void playNext(true)
}

function onActiveTrackChanged(e: {
  index?: number
  track?: { src?: string; duration?: number } | null
}) {
  if (e.index === undefined || e.track?.src === undefined) return
  const activeTrackUri = decodeURIComponent(e.track.src)
  const currentTrack = playbackStore.getState().activeTrack ?? undefined
  const currentTrackId = currentTrack?.id ?? null
  handleSleepTimerTrackChanged(lastSleepTimerTrackId, currentTrackId)
  lastSleepTimerTrackId = currentTrackId
  void handleLastFmTrackChanged(currentTrack)

  const { lastPosition } = playbackStore.getState()
  if (playCountTimeout !== null) clearTimeout(playCountTimeout)
  if (lastPosition < 10) {
    playCountTimeout = setTimeout(
      async () => {
        const trackId = await addPlayedTrack(activeTrackUri)
        if (trackId) {
          await invalidateTrackQueries(queryClient, { trackId })
          await queryClient.invalidateQueries({
            queryKey: ["history-recently-played"],
          })
          await queryClient.invalidateQueries({
            queryKey: ["history-top-tracks"],
          })
        }
      },
      (Math.min(e.track.duration!, 10) - lastPosition) * 1000
    )
  }

  void handleCrossfadeTrackActivated()
}

function onProgressUpdated(e: { position: number; duration: number }) {
  if (e.duration === 0) return
  playbackStore.setState({ lastPosition: e.position })
  const activeTrack = playbackStore.getState().activeTrack ?? undefined
  evaluateSleepTimerOnProgress(e.position, e.duration)
  void handleLastFmTrackChanged(activeTrack)
  void handlePlaybackProgress(e.position, e.duration)
  void handleCrossfadeProgress(e.position, e.duration)
}

function onPlaybackChanged(e: { state: string }) {
  if (e.state === "paused") {
    playbackStore.setState({ isPlaying: false })
  } else if (e.state === "ended") {
    const currentTrackId = playbackStore.getState().activeTrack?.id ?? null
    void handleSleepTimerPlaybackEnded(currentTrackId).then((hasStopped) => {
      if (!hasStopped) {
        advanceToNextTrackOnce()
      }
    })
  }

  void handleCrossfadePlaybackState(e.state as any)
}

async function startRuntime() {
  await ensureLoggingInitialized()
  logInfo("Reference-style app runtime starting")
  registerPlaybackService()
  await initializeTrackPlayer()
  subscribePlaybackStoreToPlayerStore()
  lastSleepTimerTrackId = playbackStore.getState().activeTrack?.id ?? null

  // Register remote media control listeners
  AudioBrowser.handleRemotePlay(() => {
    void resumeTrack()
  })
  AudioBrowser.handleRemotePause(() => {
    void pauseTrack()
  })
  AudioBrowser.handleRemoteNext(() => {
    void playNext()
  })
  AudioBrowser.handleRemotePrevious(() => {
    void playPrevious()
  })
  AudioBrowser.handleRemoteSeek((e: { position: number }) => {
    void seekTo(e.position)
  })

  // Trigger auto backup check
  const { runAutoBackupCheck } = await import("@/modules/settings/auto-backup")
  void runAutoBackupCheck()

  AudioBrowser.onActiveTrackChanged.addListener(onActiveTrackChanged)
  AudioBrowser.onProgressUpdated.addListener(onProgressUpdated)
  AudioBrowser.onPlaybackChanged.addListener(onPlaybackChanged)
  await preloadSettings()
  await loadInitialDatabaseState()
  await runStartupScan()
  logInfo("Reference-style app runtime ready")
}

export function AppRuntime({
  children,
  onReady,
  onError,
}: {
  children: ReactNode
  onReady?: () => void
  onError?: () => void
}) {
  const { t } = useTranslation()
  const { success, error: migrationError } = useMigrations(db, migrations)
  const preferenceHydrated = usePreferenceStore((state) => state._hasHydrated)
  const playbackHydrated = usePlaybackStore((state) => state._hasHydrated)
  const viewPreferenceHydrated = useViewPreferenceStore((state) => state._hasHydrated)
  const [status, setStatus] = useState<RuntimeStatus>("loading")
  const [error, setError] = useState<Error | null>(null)

  const canStart = success && preferenceHydrated && playbackHydrated && viewPreferenceHydrated

  useEffect(() => {
    if (migrationError) {
      setError(migrationError)
      setStatus("error")
      onError?.()
    }
  }, [migrationError, onError])

  useEffect(() => {
    if (!canStart || status !== "loading") {
      return
    }

    let cancelled = false

    startRuntime()
      .then(() => {
        if (cancelled) {
          return
        }
        setStatus("ready")
        onReady?.()
      })
      .catch((runtimeError) => {
        if (cancelled) {
          return
        }
        const nextError = runtimeError as Error
        logError("Reference-style app runtime failed", nextError)
        setError(nextError)
        setStatus("error")
        onError?.()
      })

    return () => {
      cancelled = true
    }
  }, [canStart, onError, onReady, status])

  const message = useMemo(() => {
    if (!error) {
      return ""
    }

    const isLegacySchemaConflict =
      error.message.includes("CREATE TABLE") || error.message.includes("already exists")
    return isLegacySchemaConflict ? t("database.schemaConflict") : error.message
  }, [error, t])

  if (status === "error" && error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="mb-2 text-center text-danger">{t("database.errorTitle")}</Text>
        <Text className="text-center text-sm text-muted-foreground">{message}</Text>
      </View>
    )
  }

  if (status === "loading") {
    return <View style={{ flex: 1, backgroundColor: "transparent" }} />
  }

  return <View className="flex-1 bg-background">{children}</View>
}

export function resetRuntimeStoresForTests() {
  playbackStore.setState({ _hasHydrated: false })
  preferenceStore.setState({ _hasHydrated: false })
}
