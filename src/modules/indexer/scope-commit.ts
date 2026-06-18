import { sql } from "drizzle-orm"

import { db } from "@/db/client"
import { wait } from "./batch-utils"

const COMMIT_SCOPE_MAX_ATTEMPTS = 3
const COMMIT_SCOPE_RETRY_DELAY_MS = 160

export const COMMIT_SCOPE_SIZE = 24

export async function runWithScopeCommit(work: () => Promise<void>): Promise<void> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= COMMIT_SCOPE_MAX_ATTEMPTS; attempt += 1) {
    try {
      await db.run(sql`BEGIN IMMEDIATE`)

      try {
        await work()
        await db.run(sql`COMMIT`)
        return
      } catch (error) {
        try {
          await db.run(sql`ROLLBACK`)
        } catch {
          // Ignore rollback failures so the original error is preserved.
        }
        throw error
      }
    } catch (error) {
      lastError = error

      if (!isTransientCommitError(error) || attempt >= COMMIT_SCOPE_MAX_ATTEMPTS) {
        break
      }

      await wait(COMMIT_SCOPE_RETRY_DELAY_MS * attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to commit indexing scope")
}

function isTransientCommitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return (
    message.includes("database is locked") ||
    message.includes("database locked") ||
    message.includes("database busy") ||
    message.includes("sql_busy")
  )
}
