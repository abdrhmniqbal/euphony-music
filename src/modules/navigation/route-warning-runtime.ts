/**
 * Purpose: Logs route parameter warnings outside render/effect-owned UI code.
 * Caller: Route screens validating local search params.
 * Dependencies: Logging service.
 * Main Functions: scheduleRouteWarning()
 * Side Effects: Emits warning logs.
 */

import { logWarn } from "@/modules/logging/service"

interface RouteWarningOptions {
  key: string
  message: string
  metadata: Record<string, unknown>
  enabled: boolean
}

export function scheduleRouteWarning({ message, metadata, enabled }: RouteWarningOptions) {
  if (enabled) {
    logWarn(message, metadata)
  }
}
