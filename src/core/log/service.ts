import { getPreferenceState } from "@/core/preferences/store"
import type { AppLogLevel } from "@/core/preferences/types"

import { enqueueFileLog, type LogContext } from "./file-appender"

const LEVEL_ORDER = {
  minimal: 0,
  extra: 1,
} satisfies Record<AppLogLevel, number>

function isExtraLoggingEnabled() {
  return LEVEL_ORDER[getPreferenceState().loggingLevel] >= LEVEL_ORDER.extra
}

export function initializeLogging() {
  enqueueFileLog("info", "logging initialized")
}

function emit(severity: "info" | "warn" | "error", message: string, context?: LogContext) {
  if (severity !== "error" && !isExtraLoggingEnabled()) {
    return
  }

  enqueueFileLog(severity, message, context)
}

export function logInfo(message: string, context?: LogContext) {
  if (isExtraLoggingEnabled()) {
    console.log(`[info] ${message}`, context ?? "")
  }
  emit("info", message, context)
}

export function logWarn(message: string, context?: LogContext) {
  if (isExtraLoggingEnabled()) {
    console.warn(`[warn] ${message}`, context ?? "")
  }
  emit("warn", message, context)
}

export function logError(message: string, cause?: unknown, context?: LogContext) {
  console.error(`[error] ${message}`, cause, context ?? "")
  emit("error", message, cause === undefined ? undefined : String(cause))
}

export { shareCrashLogs } from "./file-appender"
export type { LogContext }
