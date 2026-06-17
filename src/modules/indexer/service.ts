/**
 * Purpose: Orchestrates indexer runs, progress state, cancellation, queued runs, and incremental UI refresh.
 * Caller: Settings/library refresh controls, bootstrap auto-scan, notification actions.
 * Dependencies: Indexer repository/runtime/progress services, indexed media refresh service, logging service.
 * Main Functions: startIndexing(), forceReindexLibrary(), stopIndexing(), pauseIndexing(), resumeIndexing(), cancelIndexing().
 * Side Effects: Reads media library through repository, writes indexer progress/runtime state, refreshes player/query caches.
 */

import { refreshIndexedMediaState } from "@/modules/indexer/refresh"
import {
  rebuildSplitMetadataRelations,
  scanMediaLibrary,
} from "@/modules/indexer/repository"
import {
  consumeQueuedIndexerRun,
  finishIndexerRunRuntime,
  isIndexerRunActive,
  isIndexerRunPaused,
  isIndexerRunStale,
  pauseIndexerRunRuntime,
  queueIndexerRun,
  resumeIndexerRunRuntime,
  scheduleIndexerCompletePhaseReset,
  startIndexerRunRuntime,
  stopIndexerRunRuntime,
} from "@/modules/indexer/runtime"
import {
  beginIndexerProgress,
  completeIndexerProgress,
  failIndexerProgress,
  getIndexerProgressSnapshot,
  hideIndexerProgress,
  pauseIndexerProgress,
  resetIndexerProgress,
  resumeIndexerProgress,
  updateIndexerProgress,
} from "@/modules/indexer/progress"
import { logError, logInfo, logWarn } from "@/modules/logging/service"
import { measurePerfTrace } from "@/modules/logging/perf-trace"
import type { SplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"

const INCREMENTAL_REFRESH_INTERVAL_MS = 1500

export async function startIndexing(
  forceFullScan = false,
  showProgress = true
) {
  if (isIndexerRunActive()) {
    queueIndexerRun(forceFullScan, showProgress)
    logInfo("Indexer run queued while another run is active", {
      forceFullScan,
      showProgress,
    })
    return
  }

  const { controller, runToken: currentRunToken } = startIndexerRunRuntime()

  beginIndexerProgress(showProgress)
  logInfo("Indexer started", { forceFullScan, showProgress })
  let lastIncrementalRefreshAt = 0

  try {
    await measurePerfTrace(
      "indexer.scanMediaLibrary",
      async () => {
        await scanMediaLibrary(
          (progress) => {
            if (isIndexerRunStale(controller, currentRunToken)) {
              return
            }

            updateIndexerProgress(progress)
          },
          forceFullScan,
          controller.signal,
          async () => {
            if (isIndexerRunStale(controller, currentRunToken)) {
              return
            }

            const now = Date.now()
            if (now - lastIncrementalRefreshAt < INCREMENTAL_REFRESH_INTERVAL_MS) {
              return
            }

            lastIncrementalRefreshAt = now
            try {
              await refreshIndexedMediaState()
            } catch (error) {
              logError("Incremental indexed media refresh failed", error)
            }
          }
        )
      },
      { forceFullScan }
    )

    if (isIndexerRunStale(controller, currentRunToken)) {
      return
    }

    await measurePerfTrace("indexer.refreshIndexedMediaState", async () => {
      await refreshIndexedMediaState()
    })

    completeIndexerProgress()
    const progressSnapshot = getIndexerProgressSnapshot()
    logInfo("Indexer completed successfully", {
      forceFullScan,
      processedFiles: progressSnapshot.processedFiles,
      totalFiles: progressSnapshot.totalFiles,
    })

    scheduleIndexerCompletePhaseReset(currentRunToken, () => {
      hideIndexerProgress({ keepNotification: showProgress })
    })
  } catch (error) {
    if (isIndexerRunStale(controller, currentRunToken)) {
      return
    }

    logError("Indexer run failed", error, { forceFullScan, showProgress })
    failIndexerProgress()
  } finally {
    finishIndexerRunRuntime(controller)

    const nextQueuedRun = consumeQueuedIndexerRun(controller, currentRunToken)
    if (!nextQueuedRun) {
      return
    }

    logInfo("Starting queued indexer run", {
      forceFullScan: nextQueuedRun.forceFullScan,
      showProgress: nextQueuedRun.showProgress,
    })
    void startIndexing(nextQueuedRun.forceFullScan, nextQueuedRun.showProgress)
  }
}

export async function forceReindexLibrary(showProgress = true) {
  await startIndexing(true, showProgress)
}

export async function rebuildSplitRelationsForConfig(
  config: SplitMultipleValueConfig
) {
  const result = await measurePerfTrace(
    "indexer.rebuildSplitMetadataRelations",
    async () => await rebuildSplitMetadataRelations(config)
  )
  await measurePerfTrace("indexer.refreshAfterSplitRebuild", async () => {
    await refreshIndexedMediaState()
  })
  return result
}

export function stopIndexing() {
  logWarn("Indexer stopped")
  stopIndexerRunRuntime()
  resetIndexerProgress()
  logInfo("Indexer stop handling completed")
}

export function pauseIndexing() {
  const didPause = pauseIndexerRunRuntime()
  if (!didPause) {
    return false
  }

  pauseIndexerProgress()
  logInfo("Indexer paused")
  return true
}

export function resumeIndexing() {
  const didResume = resumeIndexerRunRuntime()
  if (!didResume) {
    return false
  }

  resumeIndexerProgress()
  logInfo("Indexer resumed")
  return true
}

export function cancelIndexing() {
  if (!isIndexerRunActive() && !isIndexerRunPaused()) {
    return false
  }

  stopIndexing()
  logInfo("Indexer canceled")
  return true
}
