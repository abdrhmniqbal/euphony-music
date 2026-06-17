/**
 * Purpose: Initializes persisted localization settings and exposes readiness as external runtime state.
 * Caller: Localization provider and app runtime bootstrap.
 * Dependencies: Language settings service.
 * Main Functions: ensureLocalizationInitialized(), subscribeLocalizationReady(), getLocalizationReadySnapshot()
 * Side Effects: Loads persisted language config and updates shared readiness state.
 */

import { ensureLanguageConfigLoaded } from "@/modules/localization/language-settings"

type LocalizationRuntimeListener = () => void

let isReady = false
let initializationPromise: Promise<void> | null = null
const listeners = new Set<LocalizationRuntimeListener>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function getLocalizationReadySnapshot() {
  return isReady
}

export function subscribeLocalizationReady(
  listener: LocalizationRuntimeListener
) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function ensureLocalizationInitialized() {
  if (isReady) {
    return Promise.resolve()
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = ensureLanguageConfigLoaded()
    .then(() => {
      isReady = true
      emitChange()
    })
    .finally(() => {
      initializationPromise = null
    })

  return initializationPromise
}
