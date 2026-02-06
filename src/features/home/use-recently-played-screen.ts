import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { startIndexing } from '@/features/indexer';
import { playTrack } from '@/features/player/player.store';
import type { Track } from '@/features/player/player.types';
import { fetchRecentlyPlayedTracks } from '@/features/home/home.service';

export function useRecentlyPlayedScreen() {
  const [history, setHistory] = useState<Track[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isActive = true;

    async function load() {
      const tracks = await fetchRecentlyPlayedTracks();
      if (isActive) {
        setHistory(tracks);
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [isFocused]);

  async function refresh() {
    startIndexing(true);
    const tracks = await fetchRecentlyPlayedTracks();
    setHistory(tracks);
  }

  function playFirst() {
    if (history.length === 0) {
      return;
    }

    playTrack(history[0], history);
  }

  function shuffle() {
    if (history.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * history.length);
    playTrack(history[randomIndex], history);
  }

  return {
    history,
    refresh,
    playFirst,
    shuffle,
  };
}
