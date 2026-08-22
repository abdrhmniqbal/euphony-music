/* eslint-disable no-console */
import { enqueueFileLog } from "./file-appender"
import { shouldEmitLog, stringifyLogPayload } from "./utils"
import type { LogSeverity } from "./utils"

export const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
}

let isInstalled = false

function writeConsoleArgs(severity: LogSeverity, args: unknown[]) {
  if (!shouldEmitLog(severity)) return
  originalConsole[severity === "critical" ? "error" : severity](...args)
}

export function installConsoleBridge() {
  if (isInstalled) return
  isInstalled = true

  console.log = (...args: unknown[]) => {
    if (shouldEmitLog("info")) originalConsole.log(...args)
    enqueueFileLog("info", args.map(stringifyLogPayload).join(" "))
  }
  
  const levels: LogSeverity[] = ["info", "debug", "warn", "error"]
  levels.forEach(level => {
    console[level as keyof typeof console] = (...args: unknown[]) => {
      writeConsoleArgs(level, args)
      enqueueFileLog(level, args.map(stringifyLogPayload).join(" "))
    }
  })
}
