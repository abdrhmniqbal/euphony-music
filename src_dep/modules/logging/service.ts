import { ensureLoggingConfigLoaded } from "./store"
import { isExtraLoggingEnabled, normalizeErrorMessage, stringifyLogPayload, shouldEmitLog } from "./utils"
import { enqueueFileLog, shareCrashLogs } from "./file-appender"
import { installConsoleBridge, originalConsole } from "./console-bridge"
import { installGlobalErrorHandler } from "./global-error-handler"

export { isExtraLoggingEnabled, shareCrashLogs }

export async function initializeLogging(): Promise<void> {
  await ensureLoggingConfigLoaded()
  installConsoleBridge()
  installGlobalErrorHandler()
}

export function logInfo(message: string, context?: unknown): void {
  if (shouldEmitLog("info")) {
    if (context === undefined) {
      originalConsole.info(message)
    } else {
      originalConsole.info(message, context)
    }
  }
  enqueueFileLog("info", message, context)
}

export function logWarn(message: string, context?: unknown): void {
  if (shouldEmitLog("warn")) {
    if (context === undefined) {
      originalConsole.warn(message)
    } else {
      originalConsole.warn(message, context)
    }
  }
  enqueueFileLog("warn", message, context)
}

export function logError(message: string, error?: unknown, context?: unknown): void {
  if (shouldEmitLog("error")) {
    if (error === undefined && context === undefined) {
      originalConsole.error(message)
    } else if (context === undefined) {
      originalConsole.error(message, error)
    } else {
      originalConsole.error(message, error, context)
    }
  }
  
  const fullMessage = normalizeErrorMessage(message, error)
  const mergedContext = context === undefined ? error : { error: stringifyLogPayload(error), context }
  enqueueFileLog("error", fullMessage, mergedContext)
}
