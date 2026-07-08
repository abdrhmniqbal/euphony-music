import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppState, View } from "react-native"

import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadInitialDatabaseState } from "@/modules/bootstrap/database-startup"
import { ensureLoggingInitialized } from "@/modules/bootstrap/runtime"
import { startIndexing } from "@/modules/indexer/service"
import { logError, logInfo } from "@/modules/logging/service"
import { registerPlaybackListeners } from "@/modules/player/playback-listeners"
import { setupPlayer } from "@/modules/player/service"
import { subscribePlaybackStoreToPlayerStore } from "@/modules/player/playback-subscriber"
import { preloadRegisteredSettings } from "@/modules/settings/registry"
import { updateSettingsState } from "@/modules/settings/store"
import { canStartIndexingNow } from "@/modules/bootstrap/utils"
import { restoreCurrentTrackForStartup } from "@/stores/playback/actions/playback-controls"
import { flushPlaybackStoreSnapshot, playbackStore, usePlaybackStore } from "@/stores/playback/store"
import { preferenceStore, usePreferenceStore } from "@/stores/preference/store"
import { useViewPreferenceStore } from "@/stores/view-preference/store"

import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import { EmptyState } from "@/components/ui/empty-state"

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
  void loadInitialDatabaseState().catch((error) =>
    logError("App runtime failed to load cached tracks", error)
  )

  logInfo("App runtime deferred work dispatched", {
    elapsedMs: Date.now() - startedAt,
  })
}

function startPostStartupRuntimeWork() {
  schedulePostStartupWork(() => {
    import("@/modules/settings/auto-backup").then(({ runAutoBackupCheck }) => {
      void runAutoBackupCheck()
    })
  })

  schedulePostStartupWork(() => {
    void runStartupScan().catch((error) =>
      logError("App runtime failed to run startup scan", error)
    )
  })
}

async function startRuntime() {
  const startedAt = Date.now()

  await ensureLoggingInitialized()
  logInfo("App runtime starting")
  await setupPlayer()
  registerPlaybackListeners()

  await playbackStore.getState().restoreActiveTrack()
  await restoreCurrentTrackForStartup()

  const settingsStartedAt = Date.now()
  await preloadSettings()
  logInfo("App runtime settings ready", {
    elapsedMs: Date.now() - settingsStartedAt,
  })
  subscribePlaybackStoreToPlayerStore()
  logInfo("App runtime critical path ready", {
    elapsedMs: Date.now() - startedAt,
  })

  startDeferredRuntimeWork(startedAt)
}

function getDatabaseErrorMessage(error: Error, t: (key: string) => string): string {
  const isLegacySchemaConflict =
    error.message.includes("CREATE TABLE") || error.message.includes("already exists")
  return isLegacySchemaConflict ? t("database.schemaConflict") : error.message
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
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        void flushPlaybackStoreSnapshot()
      }
    })
    return () => subscription.remove()
  }, [])

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
        logError("App runtime failed", nextError)
        setError(nextError)
        setStatus("error")
        onError?.()
      })

    return () => {
      cancelled = true
    }
  }, [canStart, onError, onReady, status])

  if (status === "error") {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon={<LocalCancelCircleSolidIcon className="text-danger" width={40} height={40} />}
          title={t("database.errorTitle")}
          message={error ? getDatabaseErrorMessage(error, t) : t("database.errorTitle")}
        />
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
