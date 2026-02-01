import { atom } from 'nanostores';
import TrackPlayer, { Event, State, Capability } from '@weights-ai/react-native-track-player';
import { loadFavorites } from '@/store/favorites-store';
import { 
  addToHistory, 
  incrementPlayCount,
  toggleFavoriteDB 
} from '@/db/operations';

export interface LyricLine {
    time: number;
    text: string;
}

export interface Track {
    id: string;
    title: string;
    artist?: string;
    artistId?: string;
    albumArtist?: string;
    album?: string;
    albumId?: string;
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
    discNumber?: number;
    trackNumber?: number;
    genre?: string;
}

export const $tracks = atom<Track[]>([]);
export const $currentTrack = atom<Track | null>(null);
export const $isPlaying = atom(false);
export const $currentTime = atom(0);
export const $duration = atom(0);

let isPlayerReady = false;
let currentTrackIndex = -1;

// Note: loadFavorites() is now called after database initialization in DatabaseProvider

export const setupPlayer = async () => {
    try {
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
    } catch (e) {
        console.error("Failed to setup TrackPlayer", e);
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
        // In v4, event.nextTrack is the track ID (string)
        if (event.nextTrack !== undefined && event.nextTrack !== null) {
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
                // Map from TrackPlayer's Track format back to our Track interface
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
                
                // Add to history and increment play count
                addToHistory(currentTrack.id);
                incrementPlayCount(currentTrack.id);
            }
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
        // Optionally handle queue ended - could loop or stop
    });

    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
        $currentTime.set(event.position);
        $duration.set(event.duration);
    });
};

export const playTrack = async (track: Track) => {
    if (!isPlayerReady) {
        console.warn("Player not ready");
        return;
    }

    try {
        // Reset and add the track
        await TrackPlayer.reset();
        
        // Find current track index in the queue
        const tracks = $tracks.get();
        currentTrackIndex = tracks.findIndex(t => t.id === track.id);
        
        // Add all tracks to the queue starting from the current one
        const queue = tracks.slice(currentTrackIndex).concat(tracks.slice(0, currentTrackIndex));
        
        // Map our Track interface to TrackPlayer's expected format
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
        
        // Add to history and increment play count
        addToHistory(track.id);
        incrementPlayCount(track.id);

        await TrackPlayer.play();
        $isPlaying.set(true);
    } catch (e) {
        console.error("Failed to play track", e);
    }
};

export const pauseTrack = async () => {
    try {
        await TrackPlayer.pause();
        $isPlaying.set(false);
    } catch (e) {
        console.error("Failed to pause track", e);
    }
};

export const resumeTrack = async () => {
    try {
        await TrackPlayer.play();
        $isPlaying.set(true);
    } catch (e) {
        console.error("Failed to resume track", e);
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
        console.error("Failed to seek", e);
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

export const setQueue = async (tracks: Track[]) => {
    $tracks.set(tracks);
};

// Load tracks from database
export const loadTracks = async () => {
    try {
        const db = (await import('@/db/client')).db;
        const { tracks } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const dbTracks = await db.query.tracks.findMany({
            where: eq(tracks.isDeleted, 0),
            with: {
                artist: true,
                album: true,
            },
        });
        
        // Transform database tracks to Track interface
        const trackList: Track[] = dbTracks.map(t => ({
            id: t.id,
            title: t.title,
            artist: t.artist?.name,
            artistId: t.artistId || undefined,
            albumArtist: t.artist?.name,
            album: t.album?.title,
            albumId: t.albumId || undefined,
            duration: t.duration,
            uri: t.uri,
            image: t.artwork || undefined,
            lyrics: t.lyrics ? JSON.parse(t.lyrics) : undefined,
            fileHash: t.fileHash || undefined,
            scanTime: t.scanTime || undefined,
            isDeleted: Boolean(t.isDeleted),
            playCount: t.playCount || 0,
            lastPlayedAt: t.lastPlayedAt || undefined,
            year: t.year || undefined,
            filename: t.filename || undefined,
            dateAdded: t.dateAdded || undefined,
            isFavorite: Boolean(t.isFavorite),
            discNumber: t.discNumber || undefined,
            trackNumber: t.trackNumber || undefined,
            genre: undefined, // Would need to fetch from trackGenres
        }));
        
        $tracks.set(trackList);
    } catch (error) {
        console.error('Failed to load tracks:', error);
    }
};
