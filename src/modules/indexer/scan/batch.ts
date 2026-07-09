import { logError } from "@/modules/logging/service"
import * as MediaLibrary from "expo-media-library/legacy"
import {
  ensureSplitMultipleValueConfigLoaded,
  type SplitMultipleValueConfig,
} from "@/modules/settings/split-multiple-values"
import { extractMetadata, saveArtworkToCache } from "../metadata/metadata"
import { generateAssetHash } from "@/modules/indexer/scan/file-identity"
import { normalizeMetadata } from "../metadata/normalization"
import { runWithScopeCommit, COMMIT_SCOPE_SIZE } from "@/modules/indexer/scan/scope-commit"
import { upsertPreparedAsset, type IndexingLookupCache } from "@/modules/indexer/scan/upsert"
import { waitForIndexerResume } from "@/modules/indexer/scan/runtime"
import { wait, yieldToEventLoop } from "../utils/batch"

const BATCH_CONCURRENCY = 4
const METADATA_EXTRACTION_MAX_ATTEMPTS = 2
const METADATA_EXTRACTION_RETRY_DELAY_MS = 120

export interface PreparedAssetForIndex {
  asset: MediaLibrary.Asset
  fileHash: string
  metadata: Awaited<ReturnType<typeof extractMetadata>>
  artworkPath: string | undefined
}

export interface BatchProcessingResult {
  preparedCount: number
  committedCount: number
  failedCount: number
}

export async function processBatch(
  assets: MediaLibrary.Asset[],
  onFileStart?: (asset: MediaLibrary.Asset) => void,
  signal?: AbortSignal,
  precomputedHashMap?: Map<string, string>,
  lookupCache?: IndexingLookupCache,
  splitConfig?: SplitMultipleValueConfig
): Promise<BatchProcessingResult> {
  const preparedAssets = await prepareAssets(
    assets,
    onFileStart,
    signal,
    precomputedHashMap,
    splitConfig
  )
  let committedCount = 0
  let failedCount = preparedAssets.failedCount

  for (let index = 0; index < preparedAssets.items.length; index += COMMIT_SCOPE_SIZE) {
    if (signal?.aborted) {
      return { preparedCount: preparedAssets.items.length, committedCount, failedCount }
    }

    await waitForIndexerResume(signal)
    if (signal?.aborted) {
      return { preparedCount: preparedAssets.items.length, committedCount, failedCount }
    }

    const scope = preparedAssets.items.slice(index, index + COMMIT_SCOPE_SIZE)

    try {
      await runWithScopeCommit(async () => {
        for (const prepared of scope) {
          if (signal?.aborted) {
            return
          }
          await upsertPreparedAsset(prepared, signal, lookupCache)
        }
      })
      committedCount += scope.length
    } catch (error) {
      logError("Failed to commit indexing scope; retrying asset-by-asset", error, {
        scopeSize: scope.length,
      })

      for (const prepared of scope) {
        if (signal?.aborted) {
          return { preparedCount: preparedAssets.items.length, committedCount, failedCount }
        }
        try {
          await upsertPreparedAsset(prepared, signal, lookupCache)
          committedCount += 1
        } catch (assetError) {
          failedCount += 1
          logError("Failed to index prepared asset", assetError, {
            assetId: prepared.asset.id,
            filename: prepared.asset.filename,
          })
        }
      }
    }

    await yieldToEventLoop()
  }

  return { preparedCount: preparedAssets.items.length, committedCount, failedCount }
}

async function prepareAssets(
  assets: MediaLibrary.Asset[],
  onFileStart?: (asset: MediaLibrary.Asset) => void,
  signal?: AbortSignal,
  precomputedHashMap?: Map<string, string>,
  splitConfig?: SplitMultipleValueConfig
): Promise<{ items: PreparedAssetForIndex[]; failedCount: number }> {
  const items: PreparedAssetForIndex[] = []
  let failedCount = 0
  let nextAssetIndex = 0
  const workerCount = Math.min(BATCH_CONCURRENCY, assets.length)

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextAssetIndex < assets.length) {
        if (signal?.aborted) return
        await waitForIndexerResume(signal)
        if (signal?.aborted) return

        const asset = assets[nextAssetIndex]
        nextAssetIndex += 1
        if (!asset) continue
        if (signal?.aborted) return

        onFileStart?.(asset)

        try {
          const prepared = await prepareAssetForIndexing(
            asset,
            signal,
            precomputedHashMap,
            splitConfig
          )
          if (prepared) {
            items.push(prepared)
          }
        } catch (error) {
          failedCount += 1
          logError("Failed to index asset", error, {
            assetId: asset.id,
            filename: asset.filename,
          })
        }
      }
    })
  )

  return { items, failedCount }
}

async function prepareAssetForIndexing(
  asset: MediaLibrary.Asset,
  signal?: AbortSignal,
  precomputedHashMap?: Map<string, string>,
  splitConfig?: SplitMultipleValueConfig
): Promise<PreparedAssetForIndex | null> {
  if (signal?.aborted) {
    return null
  }

  const fileHash = precomputedHashMap?.get(asset.id) || generateAssetHash(asset)
  let metadata: Awaited<ReturnType<typeof extractMetadata>> | null = null
  let lastError: unknown = null

  for (let attempt = 1; attempt <= METADATA_EXTRACTION_MAX_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) {
      return null
    }
    try {
      metadata = await extractMetadata(
        asset.uri,
        asset.filename || "",
        asset.duration,
        splitConfig || (await ensureSplitMultipleValueConfigLoaded())
      )
      break
    } catch (error) {
      lastError = error
      if (attempt < METADATA_EXTRACTION_MAX_ATTEMPTS) {
        await wait(METADATA_EXTRACTION_RETRY_DELAY_MS * attempt)
      }
    }
  }

  if (!metadata) {
    throw lastError instanceof Error ? lastError : new Error("Metadata extraction failed")
  }

  if (signal?.aborted) {
    return null
  }

  const normalizedMetadata = normalizeMetadata(metadata, asset.filename || "")
  const artworkPath = await saveArtworkToCache(metadata.artwork)
  if (signal?.aborted) {
    return null
  }

  return { asset, fileHash, metadata: normalizedMetadata, artworkPath }
}
