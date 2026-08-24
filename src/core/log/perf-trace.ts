import { logInfo, type LogContext } from "./service"

export async function measurePerfTrace<T>(
  name: string,
  task: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startedAt = Date.now()
  try {
    return await task()
  } finally {
    logInfo(`perf: ${name} took ${Date.now() - startedAt}ms`, context)
  }
}
