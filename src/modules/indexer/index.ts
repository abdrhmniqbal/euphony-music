// Indexer feature exports
export { scanMediaLibrary } from "./indexer.api"
export {
  $autoScanEnabled,
  ensureAutoScanConfigLoaded,
  setAutoScanEnabled,
} from "./auto-scan"
export {
  $trackDurationFilterConfig,
  ensureTrackDurationFilterConfigLoaded,
  getTrackDurationFilterLabel,
  getTrackDurationMinimumSeconds,
  isAssetAllowedByTrackDuration,
  setTrackDurationFilterConfig,
  type TrackDurationFilterConfig,
  type TrackDurationFilterMode,
} from "./track-duration-filter"
export {
  $folderFilterConfig,
  clearFolderFilters,
  ensureFolderFilterConfigLoaded,
  getFolderNameFromPath,
  getFolderPathFromUri,
  setAllFolderFiltersMode,
  setFolderFilterMode,
  type FolderFilterConfig,
  type FolderFilterMode,
} from "./folder-filters"
export {
  $indexerState,
  forceReindexLibrary,
  type IndexerState,
  pauseIndexing,
  resumeIndexing,
  startIndexing,
  stopIndexing,
} from "./indexer.store"
export type { IndexerScanProgress } from "./indexer.types"
export type { ScanProgress } from "./indexer.utils"
export { extractMetadata, saveArtworkToCache } from "./metadata.api"
