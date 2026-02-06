import { atom } from 'nanostores';
import { scanMediaLibrary } from '@/features/indexer/indexer.service';
import { loadTracks } from '@/features/player/player.store';
import { queryClient } from '@/lib/tanstack-query';

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

let abortController: AbortController | null = null;

const updateState = (updates: Partial<IndexerState>) => {
    $indexerState.set({ ...$indexerState.get(), ...updates });
};

export const startIndexing = async (forceFullScan = false, showProgress = true) => {
    const current = $indexerState.get();
    if (current.isIndexing) return;

    abortController = new AbortController();

    updateState({
        isIndexing: true,
        progress: 0,
        processedFiles: 0,
        phase: 'scanning',
        showProgress,
        currentFile: '',
        totalFiles: 0,
    });

    try {
        await scanMediaLibrary(
            (progress) => {
                if (abortController?.signal.aborted) return;

                updateState({
                    phase: progress.phase === 'scanning' ? 'scanning' : 'processing',
                    currentFile: progress.currentFile,
                    processedFiles: progress.current,
                    totalFiles: progress.total,
                    progress: progress.total > 0 ? (progress.current / progress.total) * 100 : 0,
                });
            },
            forceFullScan
        );

        if (!abortController?.signal.aborted) {
            // Reload tracks from database after indexing completes
            await loadTracks();
            
            // Invalidate React Query cache for albums and artists
            // This will trigger a refetch in the library screen
            queryClient.invalidateQueries({ queryKey: ['albums'] });
            queryClient.invalidateQueries({ queryKey: ['artists'] });
            
            updateState({
                phase: 'complete',
                progress: 100,
                isIndexing: false,
            });

            // Reset to idle after 3 seconds
            setTimeout(() => {
                updateState({ phase: 'idle' });
            }, 3000);
        }
    } catch (error) {
        updateState({
            isIndexing: false,
            phase: 'idle',
        });
    } finally {
        abortController = null;
    }
};

export const stopIndexing = () => {
    if (abortController) {
        abortController.abort();
        updateState({
            isIndexing: false,
            phase: 'idle',
        });
        abortController = null;
    }
};

export const pauseIndexing = () => {
    // Note: The current scanner doesn't support pausing, so we just stop
    stopIndexing();
};

export const resumeIndexing = () => {
    const state = $indexerState.get();
    if (state.phase === 'paused' || !state.isIndexing) {
        startIndexing(false);
    }
};
