/**
 * Purpose: Provides small async batching primitives for the indexer pipeline.
 * Caller: Indexer repository scan and commit loops.
 * Dependencies: None.
 * Main Functions: yieldToEventLoop(), wait(), chunkArray()
 * Side Effects: Schedules event-loop yielding and timers.
 */

export function yieldToEventLoop() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [items]
  }

  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}
