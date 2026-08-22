import { logInfo } from "./service"

export async function measurePerfTrace<T>(
  name: string,
  task: () => Promise<T>,
  context?: unknown
): Promise<T> {
  const startedAt = Date.now()
  try {
    return await task()
  } finally {
    logInfo(`perf: ${name} took ${Date.now() - startedAt}ms`, context)
  }
}
