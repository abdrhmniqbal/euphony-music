import { atom } from 'nanostores';
import { createAudioPlayer, AudioPlayer, AudioStatus } from 'expo-audio';
import { MediaControl, PlaybackState, Command } from 'expo-media-control';
import { initDatabase, addToHistory, incrementPlayCount, toggleFavoriteDB } from '@/utils/database';
import { loadFavorites } from '@/store/favorites-store';

export interface LyricLine {
    time: number;
    text: string;
}

export interface Track {
    id: string;
    title: string;
    artist?: string;
    album?: string;
    duration: number;
    uri: string;
    image?: string;
    lyrics?: LyricLine[];
    fileHash?: string;
    scanTime?: number;
    isDeleted?: boolean;
    playCount?: number;
    lastPlayedAt?: number;
    year?: number;
    filename?: string;
    dateAdded?: number;
    isFavorite?: boolean;
}

export const $tracks = atom<Track[]>([]);
export const $currentTrack = atom<Track | null>(null);
export const $isPlaying = atom(false);
export const $currentTime = atom(0);
export const $duration = atom(0);

let player: AudioPlayer | null = null;
let currentTrackIndex = -1;

initDatabase();
loadFavorites();

export const setupPlayer = async () => {
    try {
        await MediaControl.enableMediaControls({
            capabilities: [
                Command.PLAY,
                Command.PAUSE,
                Command.NEXT_TRACK,
                Command.PREVIOUS_TRACK,
                Command.SEEK,
            ],
            notification: {
                icon: 'notification_icon',
                showWhenClosed: true,
            }
        });

        MediaControl.addListener((event) => {
            switch (event.command) {
                case Command.PLAY:
                    resumeTrack();
                    break;
                case Command.PAUSE:
                    pauseTrack();
                    break;
                case Command.NEXT_TRACK:
                    playNext();
                    break;
                case Command.PREVIOUS_TRACK:
                    playPrevious();
                    break;
                case Command.SEEK:
                    if (event.data?.position !== undefined) {
                        seekTo(event.data.position);
                    }
                    break;
            }
        });
    } catch (e) {
        console.error("Failed to setup MediaControl", e);
    }
};

const setupPlayerListeners = () => {
    if (!player) return;

    player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        $currentTime.set(status.currentTime);
        $duration.set(status.duration);
        $isPlaying.set(status.playing);

        MediaControl.updatePlaybackState(
            status.playing ? PlaybackState.PLAYING : PlaybackState.PAUSED,
            status.currentTime
        );

        if (status.didJustFinish) {
            playNext();
        }
    });
};

export const playTrack = async (track: Track) => {
    if (!player) {
        player = createAudioPlayer(track.uri);
        setupPlayerListeners();
    } else {
        player.replace(track.uri);
    }

    $currentTrack.set(track);
    currentTrackIndex = $tracks.get().findIndex(t => t.id === track.id);
    $currentTrack.set(track);
    currentTrackIndex = $tracks.get().findIndex(t => t.id === track.id);
    addToHistory(track.id);
    incrementPlayCount(track.id);

    player.play();
    $isPlaying.set(true);

    try {
        await MediaControl.updateMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album || "Unknown Album",
            duration: track.duration,
            artwork: track.image ? { uri: track.image } : undefined,
        });

        MediaControl.updatePlaybackState(PlaybackState.PLAYING, 0);
    } catch (e) {
        console.warn("Failed to update media control metadata", e);
    }
};

export const pauseTrack = () => {
    if (player) {
        player.pause();
        $isPlaying.set(false);
        MediaControl.updatePlaybackState(PlaybackState.PAUSED, player.currentTime);
    }
};

export const resumeTrack = () => {
    if (player) {
        player.play();
        $isPlaying.set(true);
        MediaControl.updatePlaybackState(PlaybackState.PLAYING, player.currentTime);
    }
};

export const togglePlayback = () => {
    if (!player) return;
    if (player.playing) {
        pauseTrack();
    } else {
        resumeTrack();
    }
};

export const playNext = () => {
    const tracks = $tracks.get();
    if (tracks.length === 0) return;

    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= tracks.length) nextIndex = 0;

    playTrack(tracks[nextIndex]);
};

export const playPrevious = () => {
    const tracks = $tracks.get();
    if (tracks.length === 0) return;

    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = tracks.length - 1;

    playTrack(tracks[prevIndex]);
};

export const seekTo = (seconds: number) => {
    if (player) {
        player.seekTo(seconds);
        MediaControl.updatePlaybackState(
            player.playing ? PlaybackState.PLAYING : PlaybackState.PAUSED,
            seconds
        );
    }
};

export const toggleFavorite = (trackId: string) => {
    const tracks = $tracks.get();
    const index = tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;

    const track = tracks[index];
    const newStatus = !track.isFavorite;

    // Create new array reference for immutability
    const newTracks = [...tracks];
    newTracks[index] = { ...track, isFavorite: newStatus };
    $tracks.set(newTracks);

    const current = $currentTrack.get();
    if (current?.id === trackId) {
        $currentTrack.set({ ...current, isFavorite: newStatus });
    }

    toggleFavoriteDB(trackId, newStatus);
};
