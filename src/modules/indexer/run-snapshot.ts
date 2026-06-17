/**
 * Purpose: Persists and reads the last completed indexer run snapshot.
 * Caller: Indexer repository and status/settings surfaces.
 * Dependencies: Drizzle DB client, indexer_state schema, and indexer types.
 * Main Functions: saveIndexerRunSnapshot(), getLastIndexerRunSnapshot()
 * Side Effects: Reads/writes indexer_state rows.
 */

import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { indexerState } from "@/db/schema"

import type { IndexerRunSnapshot } from "./types"

const INDEXER_LAST_RUN_SNAPSHOT_KEY = "indexer:last-run-snapshot"

let latestIndexerRunSnapshotCache: IndexerRunSnapshot | null | undefined

export async function saveIndexerRunSnapshot(snapshot: IndexerRunSnapshot): Promise<void> {
  const now = Date.now()

  await db
    .insert(indexerState)
    .values({
      key: INDEXER_LAST_RUN_SNAPSHOT_KEY,
      value: JSON.stringify(snapshot),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: indexerState.key,
      set: {
        value: JSON.stringify(snapshot),
        updatedAt: now,
      },
    })

  latestIndexerRunSnapshotCache = snapshot
}

function parseIndexerRunSnapshot(value: unknown): IndexerRunSnapshot | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const source = value as Record<string, unknown>
  const numberFields: Array<keyof IndexerRunSnapshot> = [
    "startedAt",
    "finishedAt",
    "durationMs",
    "discoveredAssets",
    "scopedAssets",
    "skippedByUri",
    "skippedByExtension",
    "skippedByFolderFilters",
    "skippedByDurationFilters",
    "deletedTracks",
    "changedAssets",
    "unchangedAssets",
    "preparedAssets",
    "committedAssets",
    "failedAssets",
  ]

  for (const field of numberFields) {
    if (typeof source[field] !== "number" || !Number.isFinite(source[field])) {
      return null
    }
  }

  if (typeof source.forceFullScan !== "boolean") {
    return null
  }

  return {
    startedAt: source.startedAt as number,
    finishedAt: source.finishedAt as number,
    durationMs: source.durationMs as number,
    forceFullScan: source.forceFullScan,
    discoveredAssets: source.discoveredAssets as number,
    scopedAssets: source.scopedAssets as number,
    skippedByUri: source.skippedByUri as number,
    skippedByExtension: source.skippedByExtension as number,
    skippedByFolderFilters: source.skippedByFolderFilters as number,
    skippedByDurationFilters: source.skippedByDurationFilters as number,
    deletedTracks: source.deletedTracks as number,
    changedAssets: source.changedAssets as number,
    unchangedAssets: source.unchangedAssets as number,
    preparedAssets: source.preparedAssets as number,
    committedAssets: source.committedAssets as number,
    failedAssets: source.failedAssets as number,
  }
}

export async function getLastIndexerRunSnapshot(): Promise<IndexerRunSnapshot | null> {
  if (latestIndexerRunSnapshotCache !== undefined) {
    return latestIndexerRunSnapshotCache
  }

  const row = await db.query.indexerState.findFirst({
    where: eq(indexerState.key, INDEXER_LAST_RUN_SNAPSHOT_KEY),
  })

  if (!row) {
    latestIndexerRunSnapshotCache = null
    return null
  }

  try {
    const parsed = parseIndexerRunSnapshot(JSON.parse(row.value) as unknown)
    if (!parsed) {
      latestIndexerRunSnapshotCache = null
      return null
    }

    latestIndexerRunSnapshotCache = parsed
    return parsed
  } catch {
    latestIndexerRunSnapshotCache = null
    return null
  }
}
