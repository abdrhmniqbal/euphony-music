import { logError } from "@/modules/logging/service"
import { waitForIndexerResume } from "@/modules/indexer/runtime"
import { prepareBatchAssets } from "./prepared-assets"
import { runWithScopeCommit, COMMIT_SCOPE_SIZE } from "./scope-commit"
import { upsertPreparedAsset } from "./track-upsert.repository"
import { yieldToEventLoop } from "./batch-utils"
import type { IndexingLookupCache } from "./lookup-cache.repository"
import type { SplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import * as MediaLibrary from "expo-media-library/legacy"

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
  const preparedBatchResult = await prepareBatchAssets(
    assets,
    onFileStart,
    signal,
    precomputedHashMap,
    splitConfig
  )
  const preparedAssets = preparedBatchResult.preparedAssets
  let committedCount = 0
  let failedCount = preparedBatchResult.failedCount

  for (let index = 0; index < preparedAssets.length; index += COMMIT_SCOPE_SIZE) {
    if (signal?.aborted) {
      return { preparedCount: preparedAssets.length, committedCount, failedCount }
    }

    await waitForIndexerResume(signal)
    if (signal?.aborted) {
      return { preparedCount: preparedAssets.length, committedCount, failedCount }
    }

    const scope = preparedAssets.slice(index, index + COMMIT_SCOPE_SIZE)

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
          return { preparedCount: preparedAssets.length, committedCount, failedCount }
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

  return { preparedCount: preparedAssets.length, committedCount, failedCount }
}
