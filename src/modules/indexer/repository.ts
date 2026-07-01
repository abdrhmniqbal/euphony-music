/**
 * Purpose: Scans the device media library, extracts audio metadata/artwork, rebuilds split relations, and commits indexed tracks into SQLite.
 * Caller: indexer.service startIndexing(), bootstrap auto-scan, manual library refresh actions.
 * Dependencies: Expo MediaLibrary/FileSystem, Drizzle DB schema, metadata repository, split settings config, folder/duration filters, indexer runtime.
 * Main Functions: scanMediaLibrary(), rebuildSplitMetadataRelations(), getLastIndexerRunSnapshot()
 * Side Effects: Reads media library/files, writes tracks/artists/albums/genres/track_artists/track_genres/indexer_state, recomputes stored artist artwork from primary tracks during reindex, rebuilds split artist/genre relations, emits incremental commit notifications, marks missing tracks deleted, and cleans unused artwork cache files.
 */

import type { IndexerScanProgress } from "./types"
import { and, eq, inArray, sql } from "drizzle-orm"

import * as MediaLibrary from "expo-media-library/legacy"
import { db } from "@/db/client"
import { updateAlbumCounts, updateArtistCounts, updateGenreCounts } from "./counts-repository"
import { albums, artists, genres, trackArtists, trackGenres, tracks } from "@/db/schema"
import { GENRE_COLORS, GENRE_SHAPES, type GenreShape } from "@/modules/genres/constants"
import { waitForIndexerResume } from "@/modules/indexer/runtime"

import { logError } from "@/modules/logging/service"
import {
  ensureFolderFilterConfigLoaded,
  isAssetAllowedByFolderFilters,
} from "@/modules/settings/folder-filters"
import {
  ensureTrackDurationFilterConfigLoaded,
  isAssetAllowedByTrackDuration,
} from "@/modules/settings/track-duration-filter"
import { removeTracksFromFavoritesAndPlaylists } from "@/modules/tracks/track-cleanup-repository"
import {
  ensureSplitMultipleValueConfigLoaded,
  splitArtistsValue,
  splitGenresValue,
  type SplitMultipleValueConfig,
} from "@/modules/settings/split-multiple-values"
import { cleanupUnusedArtworkCache, extractMetadata, saveArtworkToCache } from "./metadata"
import { generateAssetHash, generateSortName, hashString } from "./file-identity"
import { generateId } from "@/utils/common"
import { normalizeMetadata, normalizeText } from "./normalization"
import { saveIndexerRunSnapshot } from "./run-snapshot"
import { isAllowedAssetUri, isSupportedAssetByExtension } from "./scan-filter"
import { wait, yieldToEventLoop } from "./batch-utils"
import { chunkArray } from "@/utils/array"
import { refreshLastFmArtistMetadataForIndexedArtists } from "@/modules/library/lastfm"
import {
  processDeletedTracksInScopes,
  hardDeleteSoftDeletedTracksInScopes,
} from "./deleted-tracks-repository"
export {
  rebuildSplitMetadataRelations,
  type SplitRelationRebuildResult,
} from "./relation-rebuild-repository"
import { processBatch } from "./batch-processor"
import {
  type IndexingLookupCache,
  type GenreVisualLookup,
  preloadIndexingLookupCache,
  getOrCreateArtist,
  getOrCreateAlbum,
  getOrCreateGenre,
} from "./lookup-cache-repository"

export { getLastIndexerRunSnapshot } from "./run-snapshot"

const BATCH_SIZE = 24

interface BatchProcessingResult {
  preparedCount: number
  committedCount: number
  failedCount: number
}

interface IncrementalCommitResult {
  committedAssets: number
  processedAssets: number
  totalAssets: number
}

export async function scanMediaLibrary(
  onProgress?: (progress: IndexerScanProgress) => void,
  forceFullScan = false,
  signal?: AbortSignal,
  onIncrementalCommit?: (result: IncrementalCommitResult) => Promise<void> | void
): Promise<void> {
  const startedAt = Date.now()
  let discoveredAssets = 0
  let skippedByUri = 0
  let skippedByExtension = 0
  let skippedByFolderFilters = 0
  let skippedByDurationFilters = 0
  let preparedAssetsCount = 0
  let committedAssetsCount = 0
  let failedAssetsCount = 0

  if (signal?.aborted) return

  // Get all audio assets
  const assets: MediaLibrary.Asset[] = []
  let hasMore = true
  let endCursor: string | undefined

  while (hasMore) {
    if (signal?.aborted) return
    await waitForIndexerResume(signal)
    if (signal?.aborted) return

    const result = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 500,
      after: endCursor,
    })

    if (signal?.aborted) return

    assets.push(...result.assets)
    hasMore = result.hasNextPage
    endCursor = result.endCursor

    await yieldToEventLoop()
  }

  const folderFilterConfig = await ensureFolderFilterConfigLoaded()
  const durationFilterConfig = await ensureTrackDurationFilterConfigLoaded()
  const splitConfig = await ensureSplitMultipleValueConfigLoaded()
  discoveredAssets = assets.length
  const scopedAssets: MediaLibrary.Asset[] = []

  for (const asset of assets) {
    if (!isAllowedAssetUri(asset.uri)) {
      skippedByUri += 1
      continue
    }

    if (!isSupportedAssetByExtension(asset)) {
      skippedByExtension += 1
      continue
    }

    if (!isAssetAllowedByFolderFilters(asset.uri, folderFilterConfig)) {
      skippedByFolderFilters += 1
      continue
    }

    if (!isAssetAllowedByTrackDuration(asset.duration, durationFilterConfig)) {
      skippedByDurationFilters += 1
      continue
    }

    scopedAssets.push(asset)
  }

  onProgress?.({
    phase: "scanning",
    current: 0,
    total: scopedAssets.length,
    currentFile: "",
  })

  // Get existing tracks to compare
  const existingTracks = await db.query.tracks.findMany({
    columns: { id: true, fileHash: true },
  })
  if (signal?.aborted) return

  const existingTrackMap = new Map(existingTracks.map((t) => [t.id, t.fileHash]))
  const currentAssetIds = new Set(scopedAssets.map((a) => a.id))
  const lookupCache = await preloadIndexingLookupCache()
  if (signal?.aborted) return

  // Find deleted tracks
  const deletedTrackIds = existingTracks.filter((t) => !currentAssetIds.has(t.id)).map((t) => t.id)

  if (deletedTrackIds.length > 0) {
    await processDeletedTracksInScopes(deletedTrackIds, signal)
    if (signal?.aborted) return
  }

  // Filter assets to process
  const currentAssetHashMap = new Map<string, string>()
  const assetsToProcess = forceFullScan
    ? scopedAssets
    : scopedAssets.filter((asset) => {
        const existingHash = existingTrackMap.get(asset.id)
        const currentHash = generateAssetHash(asset)
        currentAssetHashMap.set(asset.id, currentHash)
        return !existingHash || existingHash !== currentHash
      })
  const unchangedAssets = forceFullScan
    ? 0
    : Math.max(0, scopedAssets.length - assetsToProcess.length)

  // Process in batches
  for (let i = 0; i < assetsToProcess.length; i += BATCH_SIZE) {
    if (signal?.aborted) return
    await waitForIndexerResume(signal)
    if (signal?.aborted) return

    const batch = assetsToProcess.slice(i, i + BATCH_SIZE)

    const batchResult = await processBatch(
      batch,
      (asset) => {
        onProgress?.({
          phase: "processing",
          current: i + batch.indexOf(asset) + 1,
          total: assetsToProcess.length,
          currentFile: asset.filename || "Unknown",
        })
      },
      signal,
      currentAssetHashMap,
      lookupCache,
      splitConfig
    )

    preparedAssetsCount += batchResult.preparedCount
    committedAssetsCount += batchResult.committedCount
    failedAssetsCount += batchResult.failedCount

    if (batchResult.committedCount > 0) {
      await onIncrementalCommit?.({
        committedAssets: committedAssetsCount,
        processedAssets: i + batch.length,
        totalAssets: assetsToProcess.length,
      })
    }

    await yieldToEventLoop()
  }

  if (signal?.aborted) return

  await updateArtistCounts()
  if (signal?.aborted) return
  await updateAlbumCounts()
  if (signal?.aborted) return
  await updateGenreCounts()
  if (signal?.aborted) return

  await refreshLastFmArtistMetadataForIndexedArtists(forceFullScan, signal)
  if (signal?.aborted) return

  onProgress?.({
    phase: "complete",
    current: assetsToProcess.length,
    total: assetsToProcess.length,
    currentFile: "",
  })

  if (signal?.aborted) return
  await hardDeleteSoftDeletedTracksInScopes(signal)
  if (signal?.aborted) return
  await cleanupUnusedArtworkCache()

  await saveIndexerRunSnapshot({
    startedAt,
    finishedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    forceFullScan,
    discoveredAssets,
    scopedAssets: scopedAssets.length,
    skippedByUri,
    skippedByExtension,
    skippedByFolderFilters,
    skippedByDurationFilters,
    deletedTracks: deletedTrackIds.length,
    changedAssets: assetsToProcess.length,
    unchangedAssets,
    preparedAssets: preparedAssetsCount,
    committedAssets: committedAssetsCount,
    failedAssets: failedAssetsCount,
  })
}
