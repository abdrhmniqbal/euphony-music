import { useEffect, useState } from 'react';
import { startIndexing } from '@/features/indexer';
import { fetchGenreTopSongs } from '@/features/search/search.service';
import { playTrack } from '@/features/player/player.store';
import type { Track } from '@/features/player/player.types';

export function useGenreTopSongsScreen(genreName: string) {
  const [songs, setSongs] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);

      try {
        const loadedSongs = await fetchGenreTopSongs(genreName);
        if (isActive) {
          setSongs(loadedSongs);
        }
      } catch {
        if (isActive) {
          setSongs([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [genreName]);

  async function refresh() {
    startIndexing(true);
    setIsLoading(true);

    try {
      const loadedSongs = await fetchGenreTopSongs(genreName);
      setSongs(loadedSongs);
    } catch {
      setSongs([]);
    } finally {
      setIsLoading(false);
    }
  }

  function playAll() {
    if (songs.length === 0) {
      return;
    }

    playTrack(songs[0], songs);
  }

  function shuffle() {
    if (songs.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * songs.length);
    playTrack(songs[randomIndex], songs);
  }

  return {
    songs,
    isLoading,
    refresh,
    playAll,
    shuffle,
  };
}
