import { atom, computed } from 'nanostores';
import { TrackPlayer } from '@/features/player/player.service';
import { Track, $currentTrack } from './player.store';

export const $queue = atom<Track[]>([]);
export const $originalQueue = atom<Track[]>([]);
export const $isShuffled = atom<boolean>(false);

export const $queueInfo = computed(
    [$queue, $currentTrack],
    (queue, currentTrack) => {
        const currentIndex = currentTrack
            ? queue.findIndex(t => t.id === currentTrack.id)
            : -1;

        return {
            queue,
            currentIndex,
            length: queue.length,
            upNext: currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue,
            hasNext: currentIndex < queue.length - 1,
            hasPrevious: currentIndex > 0,
        };
    }
);

export const addToQueue = async (track: Track) => {
    const queue = $queue.get();
    if (queue.some(t => t.id === track.id)) return;

    $queue.set([...queue, track]);

    await TrackPlayer.add({
        id: track.id,
        url: track.uri,
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.image,
        duration: track.duration,
    });
};

export const playNext = async (track: Track) => {
    const queue = $queue.get();
    const currentTrack = $currentTrack.get();

    const filteredQueue = queue.filter(t => t.id !== track.id);

    if (!currentTrack) {
        $queue.set([track, ...filteredQueue]);
    } else {
        const currentIndex = filteredQueue.findIndex(t => t.id === currentTrack.id);
        const newQueue = [
            ...filteredQueue.slice(0, currentIndex + 1),
            track,
            ...filteredQueue.slice(currentIndex + 1)
        ];
        $queue.set(newQueue);
    }

    const tpQueue = await TrackPlayer.getQueue();
    const currentTpTrack = await TrackPlayer.getCurrentTrack();
    const insertIndex = currentTpTrack !== null
        ? tpQueue.findIndex(t => t.id === currentTpTrack) + 1
        : 0;

    await TrackPlayer.add({
        id: track.id,
        url: track.uri,
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.image,
        duration: track.duration,
    }, insertIndex);
};

export const removeFromQueue = async (trackId: string) => {
    const queue = $queue.get();
    $queue.set(queue.filter(t => t.id !== trackId));

    const tpQueue = await TrackPlayer.getQueue();
    const index = tpQueue.findIndex(t => t.id === trackId);
    if (index !== -1) {
        await TrackPlayer.remove(index);
    }
};

export const clearQueue = async () => {
    const currentTrack = $currentTrack.get();

    if (currentTrack) {
        $queue.set([currentTrack]);
    } else {
        $queue.set([]);
    }

    await TrackPlayer.reset();

    if (currentTrack) {
        await TrackPlayer.add({
            id: currentTrack.id,
            url: currentTrack.uri,
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            artwork: currentTrack.image,
            duration: currentTrack.duration,
        });
    }
};

export const setQueue = (tracks: Track[]) => {
    $queue.set(tracks);
};

export const moveInQueue = async (fromIndex: number, toIndex: number) => {
    const queue = [...$queue.get()];
    const [moved] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, moved);
    $queue.set(queue);

    await TrackPlayer.move(fromIndex, toIndex);
};

export const toggleShuffle = async () => {
    const isShuffled = $isShuffled.get();
    const queue = $queue.get();
    const currentTrack = $currentTrack.get();

    if (queue.length <= 1) return;

    if (!isShuffled) {
        // Store original queue before shuffling
        $originalQueue.set([...queue]);

        // Find current track position
        const currentIndex = currentTrack
            ? queue.findIndex(t => t.id === currentTrack.id)
            : 0;

        // Split queue: keep played + current tracks, shuffle only upcoming
        const playedAndCurrent = queue.slice(0, currentIndex + 1);
        const upcoming = queue.slice(currentIndex + 1);

        // Fisher-Yates shuffle for upcoming tracks only
        for (let i = upcoming.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
        }

        const shuffledQueue = [...playedAndCurrent, ...upcoming];
        $queue.set(shuffledQueue);
        $isShuffled.set(true);

        // Update TrackPlayer queue without interrupting playback
        // Remove all tracks after current and add shuffled upcoming tracks
        const tpQueue = await TrackPlayer.getQueue();
        const currentTpIndex = await TrackPlayer.getCurrentTrack();

        if (currentTpIndex !== null && currentTpIndex !== undefined) {
            // Remove upcoming tracks from TrackPlayer
            for (let i = tpQueue.length - 1; i > currentTpIndex; i--) {
                await TrackPlayer.remove(i);
            }

            // Add shuffled upcoming tracks
            for (const track of upcoming) {
                await TrackPlayer.add({
                    id: track.id,
                    url: track.uri,
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    artwork: track.image,
                    duration: track.duration,
                });
            }
        }
    } else {
        // Restore original queue order
        const originalQueue = $originalQueue.get();
        const currentIndex = currentTrack
            ? originalQueue.findIndex(t => t.id === currentTrack.id)
            : 0;

        // Keep played + current, restore original order for upcoming
        const playedAndCurrent = originalQueue.slice(0, currentIndex + 1);
        const originalUpcoming = originalQueue.slice(currentIndex + 1);

        const restoredQueue = [...playedAndCurrent, ...originalUpcoming];
        $queue.set(restoredQueue);
        $isShuffled.set(false);

        // Update TrackPlayer queue without interrupting playback
        const tpQueue = await TrackPlayer.getQueue();
        const currentTpIndex = await TrackPlayer.getCurrentTrack();

        if (currentTpIndex !== null && currentTpIndex !== undefined) {
            // Remove all tracks after current
            for (let i = tpQueue.length - 1; i > currentTpIndex; i--) {
                await TrackPlayer.remove(i);
            }

            // Add original upcoming tracks in order
            for (const track of originalUpcoming) {
                await TrackPlayer.add({
                    id: track.id,
                    url: track.uri,
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    artwork: track.image,
                    duration: track.duration,
                });
            }
        }
    }
};
