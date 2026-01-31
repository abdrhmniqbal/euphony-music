// Indexer feature exports
export { scanMediaLibrary } from './utils/media-scanner';
export { extractMetadata, saveArtworkToCache } from './utils/metadata-extractor';
export { 
  $indexerState, 
  startIndexing, 
  stopIndexing, 
  pauseIndexing, 
  resumeIndexing,
  type IndexerState 
} from './store/indexer-store';
