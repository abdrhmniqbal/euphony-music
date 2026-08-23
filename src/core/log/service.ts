import { getPreferenceState } from "@/core/preferences/store"
import type { AppLogLevel } from "@/core/preferences/types"

import { enqueueFileLog } from "./file-appender"

const LEVEL_ORDER: Record<AppLogLevel, number> = {
  minimal: 0,
  extra: 1,
}

function isExtraLoggingEnabled() {
  return LEVEL_ORDER[getPreferenceState().loggingLevel] >= LEVEL_ORDER.extra
}

export function initializeLogging() {
  enqueueFileLog("info", "logging initialized")
}

function emit(severity: "info" | "warn" | "error", message: string, context?: unknown) {
  if (severity !== "error" && !isExtraLoggingEnabled()) {
    return
  }

  enqueueFileLog(severity, message, context)
}

export function logInfo(message: string, context?: unknown) {
  if (isExtraLoggingEnabled()) {
    console.log(`[info] ${message}`, context ?? "")
  }
  emit("info", message, context)
}

export function logWarn(message: string, context?: unknown) {
  if (isExtraLoggingEnabled()) {
    console.warn(`[warn] ${message}`, context ?? "")
  }
  emit("warn", message, context)
}

export function logError(message: string, error?: unknown, context?: unknown) {
  console.error(`[error] ${message}`, error, context ?? "")
  emit("error", message, error === undefined ? undefined : String(error))
}

export { shareCrashLogs } from "./file-appender"
