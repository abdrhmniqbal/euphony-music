// Indexer feature exports
export { scanMediaLibrary } from "./indexer.api"
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
