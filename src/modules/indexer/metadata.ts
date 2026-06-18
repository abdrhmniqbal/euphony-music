/**
 * Purpose: Facade for metadata parsing and artwork caching modules.
 * Caller: Indexer repository and player components.
 * Dependencies: Granular submodules under metadata/ directory.
 * Main Functions: Re-exports from submodules.
 * Side Effects: None directly.
 */

export {
  type ExtractedMetadata,
  extractEmbeddedLyrics,
  extractMetadata,
} from "./metadata/native-metadata"

export {
  saveArtworkToCache,
  cleanupUnusedArtworkCache,
} from "./metadata/artwork-cache.repository"
