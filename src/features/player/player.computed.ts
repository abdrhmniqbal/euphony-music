import { computed } from 'nanostores';
import { $currentTrack, $isPlaying, $currentTime, $duration, $tracks } from './player.store';
import { $currentColors, $isLoadingColors, ColorPalette } from './player-colors.store';

export interface PlayerState {
    track: ReturnType<typeof $currentTrack.get>;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    progressPercent: number;
    formattedCurrentTime: string;
    formattedDuration: string;
}

export interface QueueState {
    tracks: ReturnType<typeof $tracks.get>;
    currentTrack: ReturnType<typeof $currentTrack.get>;
    currentIndex: number;
    queueLength: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const $playerState = computed(
    [$currentTrack, $isPlaying, $currentTime, $duration],
    (track, isPlaying, currentTime, duration): PlayerState => ({
        track,
        isPlaying,
        currentTime,
        duration,
        progressPercent: duration > 0 ? (currentTime / duration) * 100 : 0,
        formattedCurrentTime: formatTime(currentTime),
        formattedDuration: formatTime(duration),
    })
);

export const $queueState = computed(
    [$tracks, $currentTrack],
    (tracks, currentTrack): QueueState => {
        const currentIndex = currentTrack
            ? tracks.findIndex(t => t.id === currentTrack.id)
            : -1;

        return {
            tracks,
            currentTrack,
            currentIndex,
            queueLength: tracks.length,
            hasNext: currentIndex < tracks.length - 1,
            hasPrevious: currentIndex > 0,
        };
    }
);

export const $playerColors = computed(
    [$currentColors, $isLoadingColors],
    (colors, isLoading): { colors: ColorPalette; isLoading: boolean } => ({
        colors,
        isLoading,
    })
);

export const $orderedQueue = computed(
    [$tracks, $currentTrack],
    (tracks, currentTrack) => {
        if (!currentTrack || tracks.length === 0) return [];

        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) return tracks;

        return [...tracks.slice(currentIndex), ...tracks.slice(0, currentIndex)];
    }
);
