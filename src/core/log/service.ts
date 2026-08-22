import { getPreferenceState } from "@/core/preferences/store"
import type { AppLogLevel } from "@/core/preferences/types"

const LEVEL_ORDER: Record<AppLogLevel, number> = {
  minimal: 0,
  extra: 1,
}

function isExtraLoggingEnabled() {
  return LEVEL_ORDER[getPreferenceState().loggingLevel] >= LEVEL_ORDER.extra
}

export function initializeLogging() {
  // File-backed log persistence arrives with the settings phase; console output
  // is enough for the indexing and playback phases.
}

export function logInfo(message: string, context?: unknown) {
  if (isExtraLoggingEnabled()) {
    console.log(`[info] ${message}`, context ?? "")
  }
}

export function logWarn(message: string, context?: unknown) {
  if (isExtraLoggingEnabled()) {
    console.warn(`[warn] ${message}`, context ?? "")
  }
}

export function logError(message: string, error?: unknown, context?: unknown) {
  console.error(`[error] ${message}`, error, context ?? "")
}
