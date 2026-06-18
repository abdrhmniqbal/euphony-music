/**
 * Purpose: Registers foreground, media-library immediate-rescan, playback-sync, and reopen-resume lifecycle listeners.
 * Caller: Root providers during app shell initialization.
 * Dependencies: Expo MediaLibrary, React Native AppState/InteractionManager, bootstrap runtime, logging, player controls/session/store, audio playback settings, indexer scan settings.
 * Main Functions: shouldTriggerAutoScanOnMediaLibraryEvent(), registerBootstrapListeners()
 * Side Effects: Registers native listeners, schedules auto-scans, synchronizes playback state, and may resume paused playback on reopen.
 */

import * as MediaLibrary from "expo-media-library/legacy"
import { AppState, type AppStateStatus, InteractionManager } from "react-native"

import { runAutoScan } from "@/modules/bootstrap/runtime"
import { isExtraLoggingEnabled, logError, logInfo } from "@/modules/logging/service"
import { resumeTrack } from "@/modules/player/controls"
import { syncPlaybackStateAfterForeground } from "@/modules/player/session-service"
import { getCurrentTrackState, getIsPlayingState } from "@/modules/player/store"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import { ensureAutoScanConfigLoaded } from "@/modules/settings/auto-scan"

const FOREGROUND_AUTO_SCAN_DELAY_MS = 1500
const MEDIA_EVENT_AUTO_SCAN_DELAY_MS = 1500
const LONG_BACKGROUND_THRESHOLD_MS = 2 * 60 * 1000
const LONG_BACKGROUND_AUTO_SCAN_DELAY_MS = 12 * 1000

let activeBootstrapListenersCleanup: (() => void) | null = null

export function shouldTriggerAutoScanOnMediaLibraryEvent(
  event: MediaLibrary.MediaLibraryAssetsChangeEvent
) {
  return event.hasIncrementalChanges === false || (event.deletedAssets?.length ?? 0) > 0
}

export function registerBootstrapListeners() {
  if (activeBootstrapListenersCleanup) {
    if (isExtraLoggingEnabled()) {
      logInfo("Bootstrap listeners already registered")
    }
    return activeBootstrapListenersCleanup
  }

  logInfo("Registering bootstrap listeners")
  let previousState: AppStateStatus = AppState.currentState
  let backgroundedAt: number | null = null
  let pendingForegroundAutoScanTimeout: ReturnType<typeof setTimeout> | null = null
  let pendingInteractionHandle: ReturnType<typeof InteractionManager.runAfterInteractions> | null =
    null
  let pendingPlaybackSyncHandle: ReturnType<typeof InteractionManager.runAfterInteractions> | null =
    null
  let pendingDeferredMediaAutoScan = false
  let pendingDeferredMediaAutoScanBypassThrottle = false

  const clearPendingForegroundAutoScan = () => {
    if (pendingForegroundAutoScanTimeout) {
      clearTimeout(pendingForegroundAutoScanTimeout)
      pendingForegroundAutoScanTimeout = null
    }

    pendingInteractionHandle?.cancel()
    pendingInteractionHandle = null
  }

  const clearPendingForegroundWork = () => {
    clearPendingForegroundAutoScan()
    pendingPlaybackSyncHandle?.cancel()
    pendingPlaybackSyncHandle = null
  }

  const scheduleForegroundAutoScan = (options: {
    delayMs: number
    bypassThrottle?: boolean
    source: "foreground" | "media-library"
  }) => {
    const delayMs = options.delayMs
    const bypassThrottle = options.bypassThrottle ?? false
    clearPendingForegroundAutoScan()

    pendingForegroundAutoScanTimeout = setTimeout(() => {
      pendingForegroundAutoScanTimeout = null
      pendingInteractionHandle = InteractionManager.runAfterInteractions(() => {
        pendingInteractionHandle = null
        logInfo("Deferred auto scan scheduled run started", {
          delayMs,
          source: options.source,
          bypassThrottle,
        })
        void runAutoScan({ bypassThrottle })
      })
    }, delayMs)
  }

  const appStateSubscription = AppState.addEventListener("change", (nextState) => {
    if (nextState === "background") {
      backgroundedAt = Date.now()
      pendingDeferredMediaAutoScan = false
      pendingDeferredMediaAutoScanBypassThrottle = false
      clearPendingForegroundWork()
    }

    const isReturningToForeground = previousState === "background" && nextState === "active"
    previousState = nextState

    if (!isReturningToForeground) {
      return
    }

    const timeInBackgroundMs = backgroundedAt === null ? 0 : Date.now() - backgroundedAt
    const isLongBackgroundSession = timeInBackgroundMs >= LONG_BACKGROUND_THRESHOLD_MS
    const delayMs = isLongBackgroundSession
      ? LONG_BACKGROUND_AUTO_SCAN_DELAY_MS
      : FOREGROUND_AUTO_SCAN_DELAY_MS

    logInfo("App returned to foreground, scheduling auto scan", {
      timeInBackgroundMs,
      isLongBackgroundSession,
      delayMs,
      hasDeferredMediaAutoScan: pendingDeferredMediaAutoScan,
    })

    pendingPlaybackSyncHandle?.cancel()
    pendingPlaybackSyncHandle = InteractionManager.runAfterInteractions(() => {
      pendingPlaybackSyncHandle = null
      logInfo("Refreshing playback session after foreground transition", {
        timeInBackgroundMs,
        isLongBackgroundSession,
      })
      void (async () => {
        await syncPlaybackStateAfterForeground()
        const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
        if (audioPlaybackConfig.resumeOnReopen && getCurrentTrackState() && !getIsPlayingState()) {
          await resumeTrack()
        }
      })().catch((error) => {
        logError("Failed to handle foreground playback resume", error)
      })
    })

    if (pendingDeferredMediaAutoScan) {
      scheduleForegroundAutoScan({
        delayMs,
        source: "media-library",
        bypassThrottle: pendingDeferredMediaAutoScanBypassThrottle,
      })
      pendingDeferredMediaAutoScan = false
      pendingDeferredMediaAutoScanBypassThrottle = false
      return
    }

    scheduleForegroundAutoScan({ delayMs, source: "foreground" })
  })

  const mediaLibrarySubscription = MediaLibrary.addListener((event) => {
    const bypassThrottle = shouldTriggerAutoScanOnMediaLibraryEvent(event)
    const appState = AppState.currentState

    void (async () => {
      const indexerScanConfig = await ensureAutoScanConfigLoaded()
      if (!indexerScanConfig.autoScanEnabled || !indexerScanConfig.rescanImmediatelyEnabled) {
        return
      }

      if (appState !== "active") {
        pendingDeferredMediaAutoScan = true
        pendingDeferredMediaAutoScanBypassThrottle =
          pendingDeferredMediaAutoScanBypassThrottle || bypassThrottle

        if (isExtraLoggingEnabled()) {
          logInfo("Media library changed while app not active, deferring auto scan", {
            appState,
            bypassThrottle,
          })
        }
        return
      }

      if (isExtraLoggingEnabled()) {
        logInfo("Media library changed, running auto scan", {
          bypassThrottle,
          hasIncrementalChanges: event.hasIncrementalChanges,
          deletedAssetsCount: event.deletedAssets?.length ?? 0,
          insertedAssetsCount: event.insertedAssets?.length ?? 0,
        })
      }
      scheduleForegroundAutoScan({
        delayMs: MEDIA_EVENT_AUTO_SCAN_DELAY_MS,
        source: "media-library",
        bypassThrottle,
      })
    })().catch((error) => {
      logError("Failed to handle media-library auto scan event", error)
    })
  })

  const unregister = () => {
    if (activeBootstrapListenersCleanup !== unregister) {
      return
    }

    activeBootstrapListenersCleanup = null
    logInfo("Unregistering bootstrap listeners")
    clearPendingForegroundWork()
    appStateSubscription.remove()
    mediaLibrarySubscription.remove()
  }

  activeBootstrapListenersCleanup = unregister

  return unregister
}
