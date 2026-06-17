import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { initializeTrackPlayer, registerPlaybackService } from "@/core/audio/track-player.service"
import {
  getMediaLibraryPermission,
  requestMediaLibraryPermission,
} from "@/core/storage/media-library.service"
import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadInitialDatabaseState } from "@/modules/bootstrap/database-startup"
import { ensureLoggingInitialized } from "@/modules/bootstrap/runtime"
import { startIndexing } from "@/modules/indexer/service"
import { logError, logInfo } from "@/modules/logging/service"
import { ensureLoggingConfigLoaded } from "@/modules/logging/store"
import { subscribePlaybackStoreToPlayerStore } from "@/modules/player/playback-subscriber"
import { playNext, pauseTrack, resumeTrack, playPrevious, seekTo } from "@/modules/player/controls"
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
import AudioBrowser from "react-native-audio-browser"

import { addPlayedTrack } from "@/data/recent/api"
import { queryClient } from "@/lib/tanstack-query"
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
    ensureTrackDurationFilterConfigLoaded(),
  ])
}

async function resolveMediaPermission() {
  const permission = await getMediaLibraryPermission()
  if (permission.status === "undetermined" && permission.canAskAgain) {
    return requestMediaLibraryPermission()
  }

  return permission
}

async function runStartupScan() {
  if (!preferenceStore.getState().rescanOnLaunch) {
    return
  }

  const permission = await resolveMediaPermission()
  if (permission.status !== "granted") {
    logInfo("Startup scan skipped because media permission is not granted", {
      status: permission.status,
    })
    return
  }

  const config = await ensureAutoScanConfigLoaded()
  if (!config.autoScanEnabled || !config.initialScanEnabled) {
    logInfo("Startup scan skipped by scan config", config)
    return
  }

  await startIndexing(false, false)
}

let playCountTimeout: ReturnType<typeof setTimeout> | null = null
let lastAutoAdvanceAt = 0

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

  const { lastPosition } = playbackStore.getState()
  if (playCountTimeout !== null) clearTimeout(playCountTimeout)
  if (lastPosition < 10) {
    playCountTimeout = setTimeout(
      async () => {
        const trackId = await addPlayedTrack(activeTrackUri)
        if (trackId) {
          await queryClient.invalidateQueries({ queryKey: ["tracks", trackId] })
          await queryClient.invalidateQueries({ queryKey: ["tracks"] })
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
  void handleCrossfadeProgress(e.position, e.duration)
}

function onPlaybackChanged(e: { state: string }) {
  if (e.state === "paused") {
    playbackStore.setState({ isPlaying: false })
  } else if (e.state === "ended") {
    advanceToNextTrackOnce()
  }

  void handleCrossfadePlaybackState(e.state as any)
}

async function startRuntime() {
  await ensureLoggingInitialized()
  logInfo("Reference-style app runtime starting")
  registerPlaybackService()
  await initializeTrackPlayer()
  subscribePlaybackStoreToPlayerStore()

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

  AudioBrowser.onActiveTrackChanged.addListener(onActiveTrackChanged)
  AudioBrowser.onProgressUpdated.addListener(onProgressUpdated)
  AudioBrowser.onPlaybackChanged.addListener(onPlaybackChanged)
  AudioBrowser.onQueueEnded.addListener(advanceToNextTrackOnce)
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
        <Text className="text-muted-foreground text-center text-sm">{message}</Text>
      </View>
    )
  }

  return <View className="flex-1 bg-background">{children}</View>
}

export function resetRuntimeStoresForTests() {
  playbackStore.setState({ _hasHydrated: false })
  preferenceStore.setState({ _hasHydrated: false })
}
