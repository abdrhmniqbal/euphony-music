import * as MediaLibrary from "expo-media-library/legacy"
import { logError } from "@/modules/logging/service"
import { waitForIndexerResume } from "@/modules/indexer/runtime"
import {
  ensureSplitMultipleValueConfigLoaded,
  type SplitMultipleValueConfig,
} from "@/modules/settings/split-multiple-values"
import { extractMetadata, saveArtworkToCache } from "./metadata"
import { generateAssetHash } from "./file-identity"
import { normalizeMetadata } from "./normalization"
import { wait } from "./batch-utils"

const BATCH_CONCURRENCY = 4
const METADATA_EXTRACTION_MAX_ATTEMPTS = 2
const METADATA_EXTRACTION_RETRY_DELAY_MS = 120

type ExtractedMetadata = Awaited<ReturnType<typeof extractMetadata>>

export interface PreparedAssetForIndex {
  asset: MediaLibrary.Asset
  fileHash: string
  metadata: ExtractedMetadata
  artworkPath: string | undefined
}

export interface PreparedBatchResult {
  preparedAssets: PreparedAssetForIndex[]
  failedCount: number
}

export async function prepareBatchAssets(
  assets: MediaLibrary.Asset[],
  onFileStart?: (asset: MediaLibrary.Asset) => void,
  signal?: AbortSignal,
  precomputedHashMap?: Map<string, string>,
  splitConfig?: SplitMultipleValueConfig
): Promise<PreparedBatchResult> {
  const preparedAssets: PreparedAssetForIndex[] = []
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
        if (!asset) {
          continue
        }

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
            preparedAssets.push(prepared)
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

  return {
    preparedAssets,
    failedCount,
  }
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
  let metadata: ExtractedMetadata | null = null
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

  const normalizedMetadata = normalizeMetadata(metadata, asset.filename || "")

  if (signal?.aborted) {
    return null
  }

  const artworkPath = await saveArtworkToCache(metadata.artwork)
  if (signal?.aborted) {
    return null
  }

  return {
    asset,
    fileHash,
    metadata: normalizedMetadata,
    artworkPath,
  }
}
