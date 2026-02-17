import { atom } from "nanostores"

import { queryClient } from "@/lib/tanstack-query"
import { scanMediaLibrary } from "@/modules/indexer/indexer.api"
import { loadTracks } from "@/modules/player/player.store"

export interface IndexerState {
  isIndexing: boolean
  progress: number
  currentFile: string
  totalFiles: number
  processedFiles: number
  phase: "idle" | "scanning" | "processing" | "cleanup" | "complete" | "paused"
  showProgress: boolean
}

export const $indexerState = atom<IndexerState>({
  isIndexing: false,
  progress: 0,
  currentFile: "",
  totalFiles: 0,
  processedFiles: 0,
  phase: "idle",
  showProgress: false,
})

let abortController: AbortController | null = null
let runToken = 0
let completePhaseTimeout: ReturnType<typeof setTimeout> | null = null

function updateState(updates: Partial<IndexerState>) {
  $indexerState.set({ ...$indexerState.get(), ...updates })
}

export async function startIndexing(
  forceFullScan = false,
  showProgress = true
) {
  const current = $indexerState.get()
  if (current.isIndexing) return

  if (completePhaseTimeout) {
    clearTimeout(completePhaseTimeout)
    completePhaseTimeout = null
  }

  const controller = new AbortController()
  abortController = controller
  runToken += 1
  const currentRunToken = runToken

  updateState({
    isIndexing: true,
    progress: 0,
    processedFiles: 0,
    phase: "scanning",
    showProgress,
    currentFile: "",
    totalFiles: 0,
  })

  try {
    await scanMediaLibrary(
      (progress) => {
        if (controller.signal.aborted || currentRunToken !== runToken) return

        updateState({
          phase: progress.phase === "scanning" ? "scanning" : "processing",
          currentFile: progress.currentFile,
          processedFiles: progress.current,
          totalFiles: progress.total,
          progress:
            progress.total > 0 ? (progress.current / progress.total) * 100 : 0,
        })
      },
      forceFullScan,
      controller.signal
    )

    if (controller.signal.aborted || currentRunToken !== runToken) {
      return
    }

    // Reload tracks from database after indexing completes
    await loadTracks()

    if (controller.signal.aborted || currentRunToken !== runToken) {
      return
    }

    // Invalidate React Query cache for albums and artists
    // This will trigger a refetch in the library screen
    queryClient.invalidateQueries({ queryKey: ["tracks"] })
    queryClient.invalidateQueries({ queryKey: ["library", "tracks"] })
    queryClient.invalidateQueries({ queryKey: ["albums"] })
    queryClient.invalidateQueries({ queryKey: ["artists"] })
    queryClient.invalidateQueries({ queryKey: ["playlists"] })
    queryClient.invalidateQueries({ queryKey: ["favorites"] })
    queryClient.invalidateQueries({ queryKey: ["library", "favorites"] })
    queryClient.invalidateQueries({ queryKey: ["search", "genres"] })

    updateState({
      phase: "complete",
      progress: 100,
      isIndexing: false,
    })

    // Reset to idle after 3 seconds
    completePhaseTimeout = setTimeout(() => {
      if (currentRunToken !== runToken) return
      updateState({ phase: "idle", showProgress: false })
      completePhaseTimeout = null
    }, 3000)
  } catch {
    if (controller.signal.aborted || currentRunToken !== runToken) {
      return
    }

    updateState({
      isIndexing: false,
      phase: "idle",
      showProgress: false,
    })
  } finally {
    if (abortController === controller) {
      abortController = null
    }
  }
}

export function stopIndexing() {
  runToken += 1

  if (completePhaseTimeout) {
    clearTimeout(completePhaseTimeout)
    completePhaseTimeout = null
  }

  if (abortController) {
    abortController.abort()
    abortController = null
  }

  updateState({
    isIndexing: false,
    phase: "idle",
    showProgress: false,
    currentFile: "",
    progress: 0,
  })
}

export function pauseIndexing() {
  // Note: The current scanner doesn't support pausing, so we just stop
  stopIndexing()
}

export function resumeIndexing() {
  const state = $indexerState.get()
  if (state.phase === "paused" || !state.isIndexing) {
    startIndexing(false)
  }
}
