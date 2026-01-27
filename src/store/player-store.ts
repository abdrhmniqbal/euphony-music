import { atom, map } from 'nanostores';

export interface Track {
    title: string;
    subtitle: string;
    image?: string;
}

export const $currentTrack = atom<Track | null>(null);
export const $isPlaying = atom(false);
export const $progress = atom(0.35);

export const playTrack = (track: Track) => {
    $currentTrack.set(track);
    $isPlaying.set(true);
    $progress.set(0.1);
};

export const pauseTrack = () => $isPlaying.set(false);
export const resumeTrack = () => $isPlaying.set(true);
export const togglePlayback = () => $isPlaying.set(!$isPlaying.get());

export const playNext = () => console.log('Play Next');
export const playPrevious = () => console.log('Play Previous');
