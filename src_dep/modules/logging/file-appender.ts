import { File, Paths } from "expo-file-system"
import { Share } from "react-native"
import { formatLogEntry, shouldEmitLog } from "./utils"
import type { LogSeverity } from "./utils"

const CRASH_LOG_FILE = new File(Paths.document, "crash-logs.txt")
const MAX_LOG_FILE_BYTES = 1_000_000
const MAX_SHARED_LOG_CHARS = 30_000

let writeQueue = Promise.resolve()

function ensureLogFileExists() {
  if (!CRASH_LOG_FILE.exists) {
    CRASH_LOG_FILE.create({ intermediates: true, overwrite: true })
  }
}

async function appendToLogFile(content: string) {
  if (!content) return
  ensureLogFileExists()
  
  let previous = ""
  try { previous = await CRASH_LOG_FILE.text() } catch {}
  
  let next = previous + content
  if (next.length > MAX_LOG_FILE_BYTES) {
    next = next.slice(next.length - MAX_LOG_FILE_BYTES)
  }
  
  CRASH_LOG_FILE.write(next, { encoding: "utf8" })
}

export function enqueueFileLog(severity: LogSeverity, message: string, context?: unknown) {
  if (!shouldEmitLog(severity)) return
  
  const entry = formatLogEntry(severity, message, context)
  writeQueue = writeQueue
    .then(() => appendToLogFile(entry))
    .catch(() => {})
}

export async function shareCrashLogs() {
  try {
    ensureLogFileExists()
    const raw = CRASH_LOG_FILE.exists ? await CRASH_LOG_FILE.text() : ""
    const trimmed = raw.trim()
    const logPayload = trimmed 
      ? trimmed.slice(Math.max(0, trimmed.length - MAX_SHARED_LOG_CHARS))
      : "No crash logs captured yet."
      
    await Share.share({ title: "Startune Music crash logs", message: logPayload })
    return { shared: true }
  } catch {
    return { shared: false, reason: "Failed to open share sheet." }
  }
}
