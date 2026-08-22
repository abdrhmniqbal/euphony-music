/**
 * Purpose: Provides lightweight dev-only performance trace helpers for runtime workflows.
 * Caller: Bootstrap, indexer, search, player session, lyrics, and other runtime modules.
 * Dependencies: Logging service.
 * Main Functions: startPerfTrace(), measurePerfTrace()
 * Side Effects: Emits dev-only timing logs when extra logging is enabled.
 */

import { isExtraLoggingEnabled, logInfo } from "@/modules/logging/service"

interface PerfTraceContext {
  [key: string]: unknown
}

function shouldTracePerf() {
  return __DEV__ && isExtraLoggingEnabled()
}

function startPerfTrace(name: string, context?: PerfTraceContext) {
  if (!shouldTracePerf()) {
    return () => {}
  }

  const startedAt = Date.now()
  logInfo(`Perf trace started: ${name}`, context)

  return (extraContext?: PerfTraceContext) => {
    logInfo(`Perf trace completed: ${name}`, {
      ...context,
      ...extraContext,
      durationMs: Date.now() - startedAt,
    })
  }
}

export async function measurePerfTrace<T>(
  name: string,
  work: () => Promise<T>,
  context?: PerfTraceContext
) {
  const finish = startPerfTrace(name, context)

  try {
    const result = await work()
    finish()
    return result
  } catch (error) {
    finish({
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
