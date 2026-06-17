/**
 * Purpose: Logs route parameter warnings outside render/effect-owned UI code.
 * Caller: Route screens validating local search params.
 * Dependencies: Logging service.
 * Main Functions: scheduleRouteWarning()
 * Side Effects: Emits warning logs once per warning key.
 */

import { logWarn } from "@/modules/logging/service"

interface RouteWarningOptions {
  key: string
  message: string
  metadata: Record<string, unknown>
  enabled: boolean
}

const seenWarningKeys = new Set<string>()
const pendingWarnings: RouteWarningOptions[] = []
let isFlushScheduled = false

function runAfterRender(task: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task)
    return
  }

  void Promise.resolve().then(task)
}

function flushWarnings() {
  isFlushScheduled = false

  while (pendingWarnings.length > 0) {
    const warning = pendingWarnings.shift()
    if (!warning) {
      continue
    }

    logWarn(warning.message, warning.metadata)
  }
}

export function scheduleRouteWarning({ key, message, metadata, enabled }: RouteWarningOptions) {
  if (!enabled || seenWarningKeys.has(key)) {
    return
  }

  seenWarningKeys.add(key)
  pendingWarnings.push({ key, message, metadata, enabled })

  if (isFlushScheduled) {
    return
  }

  isFlushScheduled = true
  runAfterRender(flushWarnings)
}
