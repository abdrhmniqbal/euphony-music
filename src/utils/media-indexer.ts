import { File, Directory, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { atom } from 'nanostores';
import { AppState, AppStateStatus } from 'react-native';
import {
    getTracksFromDB,
    markTrackDeleted,
    getAllTrackIds,
    cleanupDeletedTracks,
    getIndexerState,
    setIndexerState,
    getArtworkByHash,
    upsertArtwork,
    batchUpsertTracks,
    ArtworkEntry,
} from './database';
import { $tracks, Track } from '@/store/player-store';

const ARTWORK_DIR_NAME = 'artwork';
const BATCH_SIZE = 10;
const METADATA_TAGS = ['artist', 'artwork', 'name', 'album', 'year'] as const;

const yieldToUI = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

export interface IndexerState {
    isIndexing: boolean;
    progress: number;
    currentFile: string;
    totalFiles: number;
    processedFiles: number;
    phase: 'idle' | 'scanning' | 'processing' | 'cleanup' | 'complete' | 'paused';
    showProgress: boolean;
}

export const $indexerState = atom<IndexerState>({
    isIndexing: false,
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    processedFiles: 0,
    phase: 'idle',
    showProgress: false,
});

let indexerAbortController: AbortController | null = null;
let completeTimeout: NodeJS.Timeout | null = null;
let artworkCacheDir: Directory | null = null;
let pausedState: { assets: MediaLibrary.Asset[]; currentIndex: number } | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

const updateIndexerState = (updates: Partial<IndexerState>) => {
    $indexerState.set({ ...$indexerState.get(), ...updates });
};

const getArtworkCacheDir = (): Directory => {
    if (!artworkCacheDir) {
        artworkCacheDir = new Directory(Paths.cache, ARTWORK_DIR_NAME);
    }
    return artworkCacheDir;
};

const ensureArtworkCacheDir = (): void => {
    const dir = getArtworkCacheDir();
    if (!dir.exists) {
        dir.create();
    }
};

const calculateFileHash = (uri: string, modificationTime: number, size: number): string => {
    return `${uri}-${modificationTime}-${size}`.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 64);
};

const calculateArtworkHash = (data: string): string => {
    const sample = data.slice(0, 1024);
    const length = data.length;
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
        hash = ((hash << 5) - hash) + sample.charCodeAt(i);
        hash |= 0;
    }
    return `${Math.abs(hash).toString(16)}_${length}`;
};

const saveArtworkToCache = (
    artworkData: string | undefined
): string | undefined => {
    if (!artworkData) return undefined;

    try {
        if (artworkData.startsWith('file://') || artworkData.startsWith('/')) {
            return artworkData;
        }

        let base64Data = artworkData;
        if (artworkData.startsWith('data:')) {
            const parts = artworkData.split(',');
            base64Data = parts[1] || '';
        }

        if (!base64Data) return undefined;

        const artworkHash = calculateArtworkHash(base64Data);

        const existingArtwork = getArtworkByHash(artworkHash);
        if (existingArtwork) {
            const existingFile = new File(existingArtwork.path);
            if (existingFile.exists) {
                return existingArtwork.path;
            }
        }

        ensureArtworkCacheDir();
        const artworkFile = new File(getArtworkCacheDir(), `${artworkHash}.jpg`);

        if (artworkFile.exists) {
            return artworkFile.uri;
        }

        artworkFile.write(base64Data, { encoding: 'base64' });

        const entry: ArtworkEntry = {
            hash: artworkHash,
            path: artworkFile.uri,
            mimeType: 'image/jpeg',
            source: 'embedded',
            createdAt: Date.now(),
        };
        upsertArtwork(entry);

        return artworkFile.uri;
    } catch (e) {
        console.warn('Failed to save artwork:', e);
        return undefined;
    }
};

const processTrack = async (
    asset: MediaLibrary.Asset,
    existingTrack: Track | null,
    forceReindex: boolean
): Promise<Track | null> => {
    try {
        const fileHash = calculateFileHash(
            asset.uri,
            asset.modificationTime,
            asset.duration
        );

        if (existingTrack && !forceReindex && existingTrack.fileHash === fileHash) {
            return existingTrack;
        }

        let metadata: Record<string, any> = {};
        try {
            const result = await getAudioMetadata(asset.uri, METADATA_TAGS);
            metadata = result.metadata || {};
        } catch (e) {
            console.warn('Failed to get metadata for', asset.filename);
        }

        const artworkPath = saveArtworkToCache(metadata.artwork);

        // Try to extract track/disc numbers from metadata or filename
        let trackNumber: number | undefined = undefined;
        let discNumber: number | undefined = undefined;
        
        // Check if metadata has track/disc number fields (various common field names)
        const trackNumRaw = metadata.trackNumber || metadata.track || metadata.TRACKNUMBER || metadata.TRACK;
        const discNumRaw = metadata.discNumber || metadata.disc || metadata.DISCNUMBER || metadata.DISC;
        
        if (trackNumRaw) {
            const parsed = parseInt(String(trackNumRaw), 10);
            if (!isNaN(parsed) && parsed > 0) trackNumber = parsed;
        }
        
        if (discNumRaw) {
            const parsed = parseInt(String(discNumRaw), 10);
            if (!isNaN(parsed) && parsed > 0) discNumber = parsed;
        }
        
        // Fallback: try to parse from filename (e.g., "01 - Track Name.mp3", "Disc 1 - 01 - Track.mp3", "1-01 Track.mp3")
        if (!trackNumber && asset.filename) {
            // Match patterns like "01 - Track", "1-01 Track", "Disc 1 - 01 Track", "01. Track"
            const patterns = [
                /^(\d+)[\s.-]/,                              // "01 - Track" or "01. Track"
                /disc\s*(\d+)[\s.-]+(\d+)/i,                 // "Disc 1 - 01 Track"
                /^(\d+)-(\d+)/,                              // "1-01 Track" (disc-track)
            ];
            
            for (const pattern of patterns) {
                const match = asset.filename.match(pattern);
                if (match) {
                    if (pattern.source.includes('disc')) {
                        discNumber = parseInt(match[1], 10);
                        trackNumber = parseInt(match[2], 10);
                    } else if (match[2] !== undefined) {
                        // Two numbers found - could be disc-track format
                        discNumber = parseInt(match[1], 10);
                        trackNumber = parseInt(match[2], 10);
                    } else {
                        // Single number found - treat as track number
                        trackNumber = parseInt(match[1], 10);
                    }
                    break;
                }
            }
        }

        const track: Track = {
            id: asset.id,
            title: metadata.name || asset.filename?.replace(/\.[^/.]+$/, '') || 'Untitled',
            artist: metadata.artist || undefined,
            album: metadata.album || undefined,
            duration: asset.duration,
            uri: asset.uri,
            image: artworkPath,
            fileHash,
            scanTime: Date.now(),
            isDeleted: false,
            year: metadata.year ? parseInt(metadata.year, 10) : undefined,
            filename: asset.filename || 'Unknown',
            dateAdded: asset.creationTime || asset.modificationTime || Date.now(),
            trackNumber,
            discNumber,
        };

        return track;
    } catch (e) {
        console.error('Error processing track:', asset.filename, e);
        return null;
    }
};

const processBatch = async (
    assets: MediaLibrary.Asset[],
    existingTracksMap: Map<string, Track>,
    forceReindex: boolean,
    signal: AbortSignal
): Promise<Track[]> => {
    const results: Track[] = [];

    for (let i = 0; i < assets.length; i++) {
        if (signal.aborted) break;

        const asset = assets[i];
        updateIndexerState({ currentFile: asset.filename || 'Unknown' });

        const existingTrack = existingTracksMap.get(asset.id) || null;
        const track = await processTrack(asset, existingTrack, forceReindex);

        if (track) {
            results.push(track);
        }

        const state = $indexerState.get();
        const processed = state.processedFiles + 1;
        updateIndexerState({
            processedFiles: processed,
            progress: (processed / state.totalFiles) * 100,
        });

        if (i % 3 === 0) {
            await yieldToUI();
        }
    }

    if (results.length > 0) {
        await yieldToUI();
        batchUpsertTracks(results);
        await yieldToUI();

        const currentTracks = $tracks.get();
        const trackMap = new Map(currentTracks.map(t => [t.id, t]));
        for (const track of results) {
            trackMap.set(track.id, track);
        }
        $tracks.set(Array.from(trackMap.values()));
    }

    return results;
};

const handleAppStateChange = (nextState: AppStateStatus): void => {
    if (nextState === 'background' || nextState === 'inactive') {
        pauseIndexing();
    } else if (nextState === 'active') {
        resumeIndexing();
    }
};

export const initLifecycleListeners = (): void => {
    if (appStateSubscription) return;
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
};

export const cleanupLifecycleListeners = (): void => {
    if (appStateSubscription) {
        appStateSubscription.remove();
        appStateSubscription = null;
    }
};

export const pauseIndexing = (): void => {
    const state = $indexerState.get();
    if (state.isIndexing && indexerAbortController) {
        indexerAbortController.abort();
        updateIndexerState({ phase: 'paused' });
        setIndexerState('paused_progress', JSON.stringify({
            processedFiles: state.processedFiles,
            totalFiles: state.totalFiles,
        }));
    }
};

export const resumeIndexing = (): void => {
    const state = $indexerState.get();
    if (state.phase === 'paused') {
        startIndexing(false);
    }
};

export const startIndexing = async (forceFullScan = false, showProgress = true): Promise<void> => {
    const currentState = $indexerState.get();
    if (currentState.isIndexing && currentState.phase !== 'paused') {
        console.log('Indexing already in progress');
        return;
    }

    if (completeTimeout) {
        clearTimeout(completeTimeout);
        completeTimeout = null;
    }

    indexerAbortController = new AbortController();
    const signal = indexerAbortController.signal;

    updateIndexerState({
        isIndexing: true,
        progress: 0,
        processedFiles: 0,
        phase: 'scanning',
        currentFile: '',
        totalFiles: 0,
        showProgress,
    });

    try {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
            throw new Error('Media library permission not granted');
        }

        if (!forceFullScan) {
            const cachedTracks = getTracksFromDB().filter(t => !t.isDeleted);
            if (cachedTracks.length > 0) {
                $tracks.set(cachedTracks);
            }
        }

        let allAssets: MediaLibrary.Asset[] = [];
        let hasMore = true;
        let endCursor: string | undefined;

        while (hasMore && !signal.aborted) {
            const result = await MediaLibrary.getAssetsAsync({
                mediaType: MediaLibrary.MediaType.audio,
                first: 500,
                after: endCursor,
            });

            allAssets = [...allAssets, ...result.assets];
            hasMore = result.hasNextPage;
            endCursor = result.endCursor;
        }

        if (signal.aborted) return;

        const existingTracks = getTracksFromDB();
        const existingTracksMap = new Map(existingTracks.map(t => [t.id, t]));
        const currentAssetIds = new Set(allAssets.map(a => a.id));

        const assetsToProcess = forceFullScan
            ? allAssets
            : allAssets.filter(asset => {
                const existing = existingTracksMap.get(asset.id);
                if (!existing) return true;
                const hash = calculateFileHash(asset.uri, asset.modificationTime, asset.duration);
                return existing.fileHash !== hash;
            });

        if (assetsToProcess.length === 0) {
            updateIndexerState({
                isIndexing: false,
                phase: 'complete',
                progress: 100,
            });
            completeTimeout = setTimeout(() => {
                updateIndexerState({ phase: 'idle' });
            }, 3000);
            return;
        }

        updateIndexerState({
            totalFiles: assetsToProcess.length,
            phase: 'processing',
        });

        for (let i = 0; i < assetsToProcess.length && !signal.aborted; i += BATCH_SIZE) {
            const batch = assetsToProcess.slice(i, i + BATCH_SIZE);
            await processBatch(batch, existingTracksMap, forceFullScan, signal);
            await yieldToUI();
        }

        if (signal.aborted) return;

        updateIndexerState({ phase: 'cleanup' });

        const allDbTrackIds = getAllTrackIds();
        for (const trackId of allDbTrackIds) {
            if (!currentAssetIds.has(trackId)) {
                markTrackDeleted(trackId);
                const currentTracks = $tracks.get();
                $tracks.set(currentTracks.filter(t => t.id !== trackId));
            }
        }

        cleanupDeletedTracks();

        setIndexerState('last_scan_timestamp', String(Date.now()));

        updateIndexerState({
            isIndexing: false,
            phase: 'complete',
            progress: 100,
        });

        completeTimeout = setTimeout(() => {
            updateIndexerState({ phase: 'idle' });
        }, 3000);

    } catch (e) {
        console.error('Indexing error:', e);
        updateIndexerState({
            isIndexing: false,
            phase: 'idle',
        });
    } finally {
        indexerAbortController = null;
    }
};

export const stopIndexing = (): void => {
    if (indexerAbortController) {
        indexerAbortController.abort();
        updateIndexerState({
            isIndexing: false,
            phase: 'idle',
        });
    }
};

export const loadTracksFromCache = (): void => {
    const cachedTracks = getTracksFromDB().filter(t => !t.isDeleted);
    $tracks.set(cachedTracks);
};

export const clearArtworkCache = (): void => {
    try {
        const dir = getArtworkCacheDir();
        if (dir.exists) {
            dir.delete();
        }
        artworkCacheDir = null;
    } catch (e) {
        console.warn('Failed to clear artwork cache:', e);
    }
};

export const getLastScanTime = (): number | null => {
    const timestamp = getIndexerState('last_scan_timestamp');
    return timestamp ? parseInt(timestamp, 10) : null;
};
