/**
 * Purpose: Consumes player route intents outside component effects.
 * Caller: Player route.
 * Dependencies: Bootstrap runtime, external file playback service, and player UI store.
 * Main Functions: schedulePlayerIntentRuntimeSync(), subscribePlayerIntentRuntime(), getPlayerIntentRuntimeSnapshot()
 * Side Effects: Starts external URI playback, updates expanded player view, and requests route replacement.
 */

import { waitForBootstrapComplete } from "@/modules/bootstrap/runtime"
import { playExternalFileUri } from "@/modules/player/service"
import {
  type PlayerExpandedView,
  setPlayerExpandedView,
} from "@/modules/ui/store"

interface PlayerIntentRuntimeSnapshot {
  isHandlingExternalUri: boolean
}

interface PlayerIntentRuntimeOptions {
  initialView: PlayerExpandedView | null
  externalUri: string | null
  replaceRoute: (route: "/player" | "/(main)/(home)") => void
}

type PlayerIntentRuntimeListener = () => void

const listeners = new Set<PlayerIntentRuntimeListener>()

let snapshot: PlayerIntentRuntimeSnapshot = {
  isHandlingExternalUri: false,
}
let pendingOptions: PlayerIntentRuntimeOptions | null = null
let isSyncScheduled = false
let lastInitialView: PlayerExpandedView | null = null
let handledExternalUri: string | null = null
let externalUriRunId = 0

function runAfterRender(task: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task)
    return
  }

  void Promise.resolve().then(task)
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function updateSnapshot(nextSnapshot: PlayerIntentRuntimeSnapshot) {
  if (snapshot.isHandlingExternalUri === nextSnapshot.isHandlingExternalUri) {
    return
  }

  snapshot = nextSnapshot
  emitChange()
}

function syncPlayerIntentRuntime({
  initialView,
  externalUri,
  replaceRoute,
}: PlayerIntentRuntimeOptions) {
  if (initialView && initialView !== lastInitialView) {
    lastInitialView = initialView
    setPlayerExpandedView(initialView)
  }

  if (!externalUri) {
    return
  }

  if (handledExternalUri === externalUri) {
    return
  }

  handledExternalUri = externalUri
  externalUriRunId += 1
  const runId = externalUriRunId
  updateSnapshot({ isHandlingExternalUri: true })

  void (async () => {
    try {
      await waitForBootstrapComplete()
      if (runId !== externalUriRunId) {
        return
      }

      const didStartPlayback = await playExternalFileUri(externalUri)
      if (runId === externalUriRunId) {
        replaceRoute(didStartPlayback ? "/player" : "/(main)/(home)")
      }
    } catch {
      if (runId === externalUriRunId) {
        replaceRoute("/(main)/(home)")
      }
    } finally {
      if (runId === externalUriRunId) {
        updateSnapshot({ isHandlingExternalUri: false })
      }
    }
  })()
}

export function getPlayerIntentRuntimeSnapshot() {
  return snapshot
}

export function subscribePlayerIntentRuntime(
  listener: PlayerIntentRuntimeListener
) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function schedulePlayerIntentRuntimeSync(
  options: PlayerIntentRuntimeOptions
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
      syncPlayerIntentRuntime(nextOptions)
    }
  })
}
