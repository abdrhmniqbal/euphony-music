/**
 * Purpose: Starts bootstrap listeners once for app lifetime outside component effects.
 * Caller: Root providers and app runtime bootstrap.
 * Dependencies: Bootstrap listeners service.
 * Main Functions: ensureBootstrapListenersStarted()
 * Side Effects: Registers long-lived app foreground and media-library listeners.
 */

import { registerBootstrapListeners } from "@/modules/bootstrap/listeners"

let hasStartedBootstrapListeners = false

export function ensureBootstrapListenersStarted() {
  if (hasStartedBootstrapListeners) {
    return
  }

  hasStartedBootstrapListeners = true
  registerBootstrapListeners()
}
