import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { startIndexing } from '@/features/indexer';
import type { Track } from '@/features/player/player.types';
import { fetchRecentlyPlayedTracks, fetchTopSongsByPeriod } from '@/features/home/home.service';

const RECENTLY_PLAYED_LIMIT = 8;
const TOP_SONGS_LIMIT = 25;

export function useHomeScreen() {
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<Track[]>([]);
  const [topSongs, setTopSongs] = useState<Track[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isActive = true;

    async function load() {
      const [recent, top] = await Promise.all([
        fetchRecentlyPlayedTracks(RECENTLY_PLAYED_LIMIT),
        fetchTopSongsByPeriod('all', TOP_SONGS_LIMIT),
      ]);

      if (!isActive) {
        return;
      }

      setRecentlyPlayedTracks(recent);
      setTopSongs(top);
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [isFocused]);

  async function refresh() {
    startIndexing(true);

    const [recent, top] = await Promise.all([
      fetchRecentlyPlayedTracks(RECENTLY_PLAYED_LIMIT),
      fetchTopSongsByPeriod('all', TOP_SONGS_LIMIT),
    ]);

    setRecentlyPlayedTracks(recent);
    setTopSongs(top);
  }

  return {
    recentlyPlayedTracks,
    topSongs,
    refresh,
  };
}
