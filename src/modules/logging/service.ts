/**
 * Purpose: Centralizes runtime logging, crash-log persistence, console bridging, and crash-log sharing.
 * Caller: bootstrap runtime, app services, repositories, device/player/indexer modules, advanced settings.
 * Dependencies: Expo FileSystem File/Paths, React Native Share API, logging settings store.
 * Main Functions: initializeLogging(), logInfo(), logWarn(), logError(), shareCrashLogs(), isExtraLoggingEnabled()
 * Side Effects: Overrides console methods, installs the global JS error handler, writes crash logs, opens the native share sheet.
 */

/* eslint-disable no-console */
import { File, Paths } from "expo-file-system"
import { Share } from "react-native"

import { ensureLoggingConfigLoaded, getLoggingConfigState } from "./store"

type LogSeverity = "debug" | "info" | "warn" | "error" | "critical"

const CRASH_LOG_FILE = new File(Paths.document, "crash-logs.txt")
const MAX_LOG_FILE_BYTES = 1_000_000
const MAX_SHARED_LOG_CHARS = 30_000

const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
}

let writeQueue: Promise<void> = Promise.resolve()
let isConsoleBridgeInstalled = false
let isGlobalErrorHandlerInstalled = false

interface ErrorUtilsLike {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void
}

function shouldPersistLog(severity: LogSeverity): boolean {
  return shouldEmitLog(severity)
}

function shouldEmitLog(severity: LogSeverity): boolean {
  if (isExtraLoggingEnabled()) {
    return true
  }

  return severity === "error" || severity === "critical"
}

function writeConsoleLog(severity: LogSeverity, message: string, context?: unknown): void {
  if (!shouldEmitLog(severity)) {
    return
  }

  const consoleMethod =
    severity === "debug"
      ? originalConsole.debug
      : severity === "info"
        ? originalConsole.info
        : severity === "warn"
          ? originalConsole.warn
          : originalConsole.error

  if (context === undefined) {
    consoleMethod(message)
    return
  }

  consoleMethod(message, context)
}

function writeConsoleArgs(severity: LogSeverity, args: unknown[]): void {
  if (!shouldEmitLog(severity)) {
    return
  }

  switch (severity) {
    case "debug":
      originalConsole.debug(...args)
      return
    case "info":
      originalConsole.info(...args)
      return
    case "warn":
      originalConsole.warn(...args)
      return
    case "error":
    case "critical":
      originalConsole.error(...args)
      return
  }
}

export function isExtraLoggingEnabled(): boolean {
  return getLoggingConfigState().level === "extra"
}

function stringifyLogPayload(payload: unknown): string {
  if (payload instanceof Error) {
    const stack = payload.stack ? `\n${payload.stack}` : ""
    return `${payload.name}: ${payload.message}${stack}`
  }

  if (typeof payload === "string") {
    return payload
  }

  try {
    return JSON.stringify(payload)
  } catch {
    return String(payload)
  }
}

function formatLogEntry(severity: LogSeverity, message: string, context?: unknown): string {
  const timestamp = new Date().toISOString()
  const contextText = context === undefined ? "" : `\ncontext: ${stringifyLogPayload(context)}`
  return `[${timestamp}] [${severity.toUpperCase()}] ${message}${contextText}\n`
}

function ensureLogFileExists() {
  if (!CRASH_LOG_FILE.exists) {
    CRASH_LOG_FILE.create({
      intermediates: true,
      overwrite: true,
    })
  }
}

async function appendToLogFile(content: string): Promise<void> {
  if (!content) {
    return
  }

  ensureLogFileExists()

  let previous = ""
  try {
    previous = await CRASH_LOG_FILE.text()
  } catch {
    previous = ""
  }

  let next = `${previous}${content}`
  if (next.length > MAX_LOG_FILE_BYTES) {
    next = next.slice(next.length - MAX_LOG_FILE_BYTES)
  }

  CRASH_LOG_FILE.write(next, { encoding: "utf8" })
}

function enqueueFileLog(severity: LogSeverity, message: string, context?: unknown): void {
  if (!shouldPersistLog(severity)) {
    return
  }

  const entry = formatLogEntry(severity, message, context)
  writeQueue = writeQueue
    .then(() => appendToLogFile(entry))
    .catch(() => {
      // Intentionally swallow logging failures to avoid recursive crashes.
    })
}

function normalizeErrorMessage(message: string, error?: unknown): string {
  if (!error) {
    return message
  }

  if (error instanceof Error) {
    return `${message}: ${error.message}`
  }

  return `${message}: ${stringifyLogPayload(error)}`
}

function installConsoleBridge() {
  if (isConsoleBridgeInstalled) {
    return
  }

  isConsoleBridgeInstalled = true

  console.log = (...args: unknown[]) => {
    if (shouldEmitLog("info")) {
      originalConsole.log(...args)
    }
    enqueueFileLog("info", args.map(stringifyLogPayload).join(" "))
  }
  console.info = (...args: unknown[]) => {
    writeConsoleArgs("info", args)
    enqueueFileLog("info", args.map(stringifyLogPayload).join(" "))
  }
  console.debug = (...args: unknown[]) => {
    writeConsoleArgs("debug", args)
    enqueueFileLog("debug", args.map(stringifyLogPayload).join(" "))
  }
  console.warn = (...args: unknown[]) => {
    writeConsoleArgs("warn", args)
    enqueueFileLog("warn", args.map(stringifyLogPayload).join(" "))
  }
  console.error = (...args: unknown[]) => {
    writeConsoleArgs("error", args)
    enqueueFileLog("error", args.map(stringifyLogPayload).join(" "))
  }
}

function installGlobalErrorHandler() {
  if (isGlobalErrorHandlerInstalled) {
    return
  }

  const maybeErrorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike })?.ErrorUtils
  if (!maybeErrorUtils?.getGlobalHandler || !maybeErrorUtils?.setGlobalHandler) {
    return
  }

  isGlobalErrorHandlerInstalled = true
  const previousHandler = maybeErrorUtils.getGlobalHandler()
  const activeGlobalErrorHandler = (error: unknown, isFatal?: boolean) => {
    const label = isFatal ? "Fatal JS error" : "Unhandled JS error"
    const message = normalizeErrorMessage(label, error)
    enqueueFileLog("critical", message, error)
    previousHandler?.(error, Boolean(isFatal))
  }

  maybeErrorUtils.setGlobalHandler(activeGlobalErrorHandler)
}

export async function initializeLogging(): Promise<void> {
  await ensureLoggingConfigLoaded()
  installConsoleBridge()
  installGlobalErrorHandler()
}

export function logInfo(message: string, context?: unknown): void {
  writeConsoleLog("info", message, context)
  enqueueFileLog("info", message, context)
}

export function logWarn(message: string, context?: unknown): void {
  writeConsoleLog("warn", message, context)
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
  const mergedContext =
    context === undefined ? error : { error: stringifyLogPayload(error), context }
  enqueueFileLog("error", fullMessage, mergedContext)
}

export async function shareCrashLogs(): Promise<{
  shared: boolean
  reason?: string
}> {
  try {
    ensureLogFileExists()
    const raw = CRASH_LOG_FILE.exists ? await CRASH_LOG_FILE.text() : ""
    const trimmed = raw.trim()
    const logPayload = trimmed
      ? trimmed.slice(Math.max(0, trimmed.length - MAX_SHARED_LOG_CHARS))
      : "No crash logs captured yet."

    await Share.share({
      title: "Startune Music crash logs",
      message: logPayload,
    })

    return { shared: true }
  } catch (error) {
    logError("Failed to share crash logs", error)
    return { shared: false, reason: "Failed to open share sheet." }
  }
}
