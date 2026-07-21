import { enqueueFileLog } from "./file-appender"
import { normalizeErrorMessage } from "./utils"

interface ErrorUtilsLike {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void
}

let isInstalled = false

export function installGlobalErrorHandler() {
  if (isInstalled) return

  const maybeErrorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike })?.ErrorUtils
  if (!maybeErrorUtils?.getGlobalHandler || !maybeErrorUtils?.setGlobalHandler) return

  isInstalled = true
  const previousHandler = maybeErrorUtils.getGlobalHandler()
  
  maybeErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const label = isFatal ? "Fatal JS error" : "Unhandled JS error"
    const message = normalizeErrorMessage(label, error)
    enqueueFileLog("critical", message, error)
    previousHandler?.(error, Boolean(isFatal))
  })
}
