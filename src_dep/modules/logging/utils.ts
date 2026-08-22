import { getLoggingConfigState } from "./store"

export type LogSeverity = "debug" | "info" | "warn" | "error" | "critical"

export function isExtraLoggingEnabled(): boolean {
  return getLoggingConfigState().level === "extra"
}

export function shouldEmitLog(severity: LogSeverity): boolean {
  if (isExtraLoggingEnabled()) return true
  return severity === "error" || severity === "critical"
}

export function stringifyLogPayload(payload: unknown): string {
  if (payload instanceof Error) {
    const stack = payload.stack ? `\n${payload.stack}` : ""
    return `${payload.name}: ${payload.message}${stack}`
  }
  if (typeof payload === "string") return payload
  try {
    return JSON.stringify(payload)
  } catch {
    return String(payload)
  }
}

export function formatLogEntry(severity: LogSeverity, message: string, context?: unknown): string {
  const timestamp = new Date().toISOString()
  const contextText = context === undefined ? "" : `\ncontext: ${stringifyLogPayload(context)}`
  return `[${timestamp}] [${severity.toUpperCase()}] ${message}${contextText}\n`
}

export function normalizeErrorMessage(message: string, error?: unknown): string {
  if (!error) return message
  if (error instanceof Error) return `${message}: ${error.message}`
  return `${message}: ${stringifyLogPayload(error)}`
}
