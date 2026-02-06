import { atom } from 'nanostores';
import { Capability, Event, RepeatMode, State, TrackPlayer } from '@/features/player/player.service';
import { loadFavorites } from '@/features/favorites/favorites.store';
import {
    addToHistory,
    incrementPlayCount,
    toggleFavoriteDB
} from '@/db/operations';
import type { LyricLine, Track, Album, Artist } from './player.types';
export type { LyricLine, Track, Album, Artist };

export const $tracks = atom<Track[]>([]);
export const $currentTrack = atom<Track | null>(null);
export const $isPlaying = atom(false);
export const $currentTime = atom(0);
export const $duration = atom(0);

export type RepeatModeType = 'off' | 'track' | 'queue';
export const $repeatMode = atom<RepeatModeType>('off');

let isPlayerReady = false;
let currentTrackIndex = -1;

// Note: loadFavorites() is now called after database initialization in DatabaseProvider

export const setupPlayer = async () => {
    try {
        // Check if player is already initialized
        if (isPlayerReady) {
            return;
        }

        await TrackPlayer.setupPlayer({
            autoHandleInterruptions: true,
        });

        await TrackPlayer.updateOptions({
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.SeekTo,
            ],
            compactCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
            ],
            progressUpdateEventInterval: 1,
        });

        isPlayerReady = true;
    } catch (e: any) {
        // If already initialized, mark as ready
        if (e?.message?.includes('already been initialized')) {
            isPlayerReady = true;
        }
    }
};

// Playback service for background controls
export const PlaybackService = async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => {
        TrackPlayer.play();
    });

    TrackPlayer.addEventListener(Event.RemotePause, () => {
        TrackPlayer.pause();
    });

    TrackPlayer.addEventListener(Event.RemoteNext, () => {
        playNext();
    });

    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
        playPrevious();
    });

    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        if (event.position !== undefined) {
            TrackPlayer.seekTo(event.position);
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
        $isPlaying.set(event.state === State.Playing);
    });

    // v4 API: Use PlaybackTrackChanged with nextTrack property
    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
        if (event.nextTrack !== undefined && event.nextTrack !== null) {
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
                const currentTrack: Track = {
                    id: track.id as string,
                    title: track.title as string,
                    artist: track.artist,
                    album: track.album,
                    duration: track.duration || 0,
                    uri: track.url as string,
                    image: track.artwork as string | undefined,
                };
                $currentTrack.set(currentTrack);

                addToHistory(currentTrack.id);
                incrementPlayCount(currentTrack.id);
            }
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
        $currentTime.set(event.position);
        $duration.set(event.duration);
    });
};

export const playTrack = async (track: Track, playlistTracks?: Track[]) => {
    if (!isPlayerReady) {
        return;
    }

    try {
        const { $queue, setQueue } = await import('./queue.store');

        await TrackPlayer.reset();

        const tracks = playlistTracks || $tracks.get();
        currentTrackIndex = tracks.findIndex(t => t.id === track.id);

        const queue = tracks.slice(currentTrackIndex).concat(tracks.slice(0, currentTrackIndex));

        setQueue(queue);

        await TrackPlayer.add(
            queue.map(t => ({
                id: t.id,
                url: t.uri,
                title: t.title,
                artist: t.artist,
                album: t.album,
                artwork: t.image,
                duration: t.duration,
            }))
        );

        $currentTrack.set(track);

        addToHistory(track.id);
        incrementPlayCount(track.id);

        await TrackPlayer.play();
        $isPlaying.set(true);
    } catch (e) {
    }
};

export const pauseTrack = async () => {
    try {
        await TrackPlayer.pause();
        $isPlaying.set(false);
    } catch (e) {
    }
};

export const resumeTrack = async () => {
    try {
        await TrackPlayer.play();
        $isPlaying.set(true);
    } catch (e) {
    }
};

export const togglePlayback = async () => {
    // v4 API: getState() returns the state directly
    const state = await TrackPlayer.getState();
    if (state === State.Playing) {
        await pauseTrack();
    } else {
        await resumeTrack();
    }
};

export const playNext = async () => {
    try {
        await TrackPlayer.skipToNext();
        // v4 API: getCurrentTrack() returns the track ID (string)
        const currentTrackId = await TrackPlayer.getCurrentTrack();
        if (currentTrackId !== undefined && currentTrackId !== null) {
            const track = await TrackPlayer.getTrack(currentTrackId);
            if (track) {
                // Map from TrackPlayer's Track format back to our Track interface
                $currentTrack.set({
                    id: track.id as string,
                    title: track.title as string,
                    artist: track.artist,
                    album: track.album,
                    duration: track.duration || 0,
                    uri: track.url as string,
                    image: track.artwork as string | undefined,
                } as Track);
            }
        }
    } catch (e) {
        // If at end of queue, wrap to beginning
        const tracks = $tracks.get();
        if (tracks.length > 0) {
            await playTrack(tracks[0]);
        }
    }
};

export const playPrevious = async () => {
    try {
        // v4 API: getPosition() returns position directly
        const position = await TrackPlayer.getPosition();
        if (position > 3) {
            await TrackPlayer.seekTo(0);
        } else {
            await TrackPlayer.skipToPrevious();
            // v4 API: getCurrentTrack() returns the track ID (string)
            const currentTrackId = await TrackPlayer.getCurrentTrack();
            if (currentTrackId !== undefined && currentTrackId !== null) {
                const track = await TrackPlayer.getTrack(currentTrackId);
                if (track) {
                    // Map from TrackPlayer's Track format back to our Track interface
                    $currentTrack.set({
                        id: track.id as string,
                        title: track.title as string,
                        artist: track.artist,
                        album: track.album,
                        duration: track.duration || 0,
                        uri: track.url as string,
                        image: track.artwork as string | undefined,
                    } as Track);
                }
            }
        }
    } catch (e) {
        // If at beginning of queue, stay at first track
    }
};

export const seekTo = async (seconds: number) => {
    try {
        await TrackPlayer.seekTo(seconds);
    } catch (e) {
    }
};

export const setRepeatMode = async (mode: RepeatModeType) => {
    try {
        let trackPlayerMode: RepeatMode;
        switch (mode) {
            case 'track':
                trackPlayerMode = RepeatMode.Track;
                break;
            case 'queue':
                trackPlayerMode = RepeatMode.Queue;
                break;
            case 'off':
            default:
                trackPlayerMode = RepeatMode.Off;
        }
        await TrackPlayer.setRepeatMode(trackPlayerMode);
        $repeatMode.set(mode);
    } catch (e) {
    }
};

export const toggleRepeatMode = async () => {
    const currentMode = $repeatMode.get();
    const nextMode: RepeatModeType = currentMode === 'off' ? 'track' : currentMode === 'track' ? 'queue' : 'off';
    await setRepeatMode(nextMode);
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

export const setQueue = async (tracks: Track[]) => {
    $tracks.set(tracks);
};

// Load tracks from database
export const loadTracks = async () => {
    try {
        const db = (await import('@/db/client')).db;
        const { tracks } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        const { transformDBTrackToTrack } = await import('@/utils/transformers');

        const dbTracks = await db.query.tracks.findMany({
            where: eq(tracks.isDeleted, 0),
            with: {
                artist: true,
                album: true,
                genres: {
                    with: {
                        genre: true,
                    },
                },
            },
        });

        const trackList = dbTracks.map(transformDBTrackToTrack);
        $tracks.set(trackList);
    } catch (error) {
    }
};
