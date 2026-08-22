import { eq } from "drizzle-orm"

import { db } from "@/core/db"
import { indexerState as indexerStateTable } from "@/core/db/schema"
import type { IndexerRunSnapshot } from "./types"

const INDEXER_STATE_SNAPSHOT_KEY = "last_run_snapshot"

export async function saveIndexerRunSnapshot(snapshot: IndexerRunSnapshot) {
  const now = Date.now()
  await db
    .insert(indexerStateTable)
    .values({
      key: INDEXER_STATE_SNAPSHOT_KEY,
      value: JSON.stringify(snapshot),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: indexerStateTable.key,
      set: { value: JSON.stringify(snapshot), updatedAt: now },
    })
}

export async function getLastIndexerRunSnapshot(): Promise<IndexerRunSnapshot | null> {
  const row = await db.query.indexerState.findFirst({
    where: eq(indexerStateTable.key, INDEXER_STATE_SNAPSHOT_KEY),
  })
  if (!row) {
    return null
  }

  try {
    return JSON.parse(row.value) as IndexerRunSnapshot
  } catch {
    return null
  }
}
