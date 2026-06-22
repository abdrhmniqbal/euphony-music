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
import { registerPlaybackListeners } from "@/modules/player/playback-listeners"
import { subscribePlaybackStoreToPlayerStore } from "@/modules/player/playback-subscriber"
import { preloadRegisteredSettings } from "@/modules/settings/registry"
import { updateSettingsState } from "@/modules/settings/store"
import { canStartIndexingNow } from "@/modules/bootstrap/utils"
import { loadCurrentTrack } from "@/stores/playback/actions/playback-controls"
import { playbackStore, usePlaybackStore } from "@/stores/playback/store"
import { preferenceStore, usePreferenceStore } from "@/stores/preference/store"
import { useViewPreferenceStore } from "@/stores/view-preference/store"

type RuntimeStatus = "loading" | "ready" | "error"

const STARTUP_BACKGROUND_WORK_DELAY_MS = 3000

function schedulePostStartupWork(task: () => void) {
  setTimeout(task, STARTUP_BACKGROUND_WORK_DELAY_MS)
}

async function preloadSettings() {
  await preloadRegisteredSettings()
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

function startDeferredRuntimeWork(startedAt: number) {
  const deferredStartedAt = Date.now()

  const dbStartedAt = Date.now()
  void loadInitialDatabaseState()
    .then(() =>
      logInfo("Deferred startup cached DB ready", { elapsedMs: Date.now() - dbStartedAt })
    )
    .catch((error) => logError("Reference-style app runtime failed to load cached tracks", error))

  logInfo("Reference-style app runtime deferred work dispatched", {
    elapsedMs: Date.now() - deferredStartedAt,
    totalElapsedMs: Date.now() - startedAt,
  })
}

function startPostStartupRuntimeWork() {
  schedulePostStartupWork(() => {
    import("@/modules/settings/auto-backup").then(({ runAutoBackupCheck }) => {
      void runAutoBackupCheck()
    })
  })

  schedulePostStartupWork(() => {
    const scanStartedAt = Date.now()
    void runStartupScan()
      .then(() => logInfo("Post-startup scan ready", { elapsedMs: Date.now() - scanStartedAt }))
      .catch((error) => logError("Reference-style app runtime failed to run startup scan", error))
  })
}

async function startRuntime() {
  const startedAt = Date.now()

  await ensureLoggingInitialized()
  logInfo("Reference-style app runtime starting")
  registerPlaybackService()
  await initializeTrackPlayer()
  registerPlaybackListeners()

  await playbackStore.getState().restoreActiveTrack()
  await loadCurrentTrack()

  const settingsStartedAt = Date.now()
  await preloadSettings()
  logInfo("Reference-style app runtime settings ready", {
    elapsedMs: Date.now() - settingsStartedAt,
  })
  subscribePlaybackStoreToPlayerStore()
  logInfo("Reference-style app runtime critical path ready", {
    elapsedMs: Date.now() - startedAt,
  })

  startDeferredRuntimeWork(startedAt)
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
        startPostStartupRuntimeWork()
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
