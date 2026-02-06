// Indexer feature exports
export { scanMediaLibrary } from './indexer.service';
export { extractMetadata, saveArtworkToCache } from './utils/metadata-extractor';
export type { IndexerScanProgress } from './indexer.types';
export { 
  $indexerState, 
  startIndexing, 
  stopIndexing, 
  pauseIndexing, 
  resumeIndexing,
  type IndexerState 
} from './store/indexer-store';
