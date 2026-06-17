/**
 * Purpose: Owns indexing progress toast visibility and completion timeout outside React effects.
 * Caller: IndexingProgress component.
 * Dependencies: HeroUI Native toast adapter shape and indexer store snapshot.
 * Main Functions: scheduleIndexingProgressToastSync()
 * Side Effects: Shows and hides indexing progress toast.
 */

import type { ReactNode } from "react"
import type { ToastComponentProps } from "heroui-native"

import type { IndexerState } from "@/modules/indexer/store"

const TOAST_ID = "indexing-progress-toast"
const COMPLETE_HIDE_DELAY_MS = 1500

interface ToastAdapter {
  show: (options: {
    id: string
    duration: "persistent"
    component: (props: ToastComponentProps) => ReactNode
  }) => void
  hide: (id: string) => void
}

interface IndexingProgressToastRuntimeOptions {
  state: IndexerState
  toast: ToastAdapter
  component: (props: ToastComponentProps) => ReactNode
}

let pendingOptions: IndexingProgressToastRuntimeOptions | null = null
let isSyncScheduled = false
let isToastVisible = false
let isCompleteDismissed = false
let completeHideTimeout: ReturnType<typeof setTimeout> | null = null

function runAfterRender(task: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task)
    return
  }

  void Promise.resolve().then(task)
}

function clearCompleteHideTimeout() {
  if (completeHideTimeout === null) {
    return
  }

  clearTimeout(completeHideTimeout)
  completeHideTimeout = null
}

function hideToast(toast: ToastAdapter) {
  if (!isToastVisible) {
    return
  }

  toast.hide(TOAST_ID)
  isToastVisible = false
}

function syncIndexingProgressToast({
  state,
  toast,
  component,
}: IndexingProgressToastRuntimeOptions) {
  const shouldShowToast =
    state.showProgress && (state.isIndexing || state.phase === "complete")

  if (state.phase !== "complete") {
    isCompleteDismissed = false
    clearCompleteHideTimeout()
  }

  if (
    shouldShowToast &&
    !isToastVisible &&
    !(state.phase === "complete" && isCompleteDismissed)
  ) {
    toast.show({
      id: TOAST_ID,
      duration: "persistent",
      component,
    })
    isToastVisible = true
  }

  if (!shouldShowToast) {
    clearCompleteHideTimeout()
    hideToast(toast)
    return
  }

  if (state.phase !== "complete" || completeHideTimeout !== null) {
    return
  }

  completeHideTimeout = setTimeout(() => {
    completeHideTimeout = null
    toast.hide(TOAST_ID)
    isToastVisible = false
    isCompleteDismissed = true
  }, COMPLETE_HIDE_DELAY_MS)
}

export function scheduleIndexingProgressToastSync(
  options: IndexingProgressToastRuntimeOptions
) {
  pendingOptions = options

  if (isSyncScheduled) {
    return
  }

  isSyncScheduled = true
  runAfterRender(() => {
    isSyncScheduled = false
    const nextOptions = pendingOptions
    pendingOptions = null

    if (nextOptions) {
      syncIndexingProgressToast(nextOptions)
    }
  })
}
