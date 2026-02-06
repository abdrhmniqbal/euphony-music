import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { startIndexing } from '@/features/indexer';
import { playTrack } from '@/features/player/player.store';
import type { Track } from '@/features/player/player.types';
import { fetchTopSongsByPeriod } from '@/features/home/home.service';

export const TOP_SONGS_TABS = ['Realtime', 'Daily', 'Weekly'] as const;
export type TopSongsTab = (typeof TOP_SONGS_TABS)[number];

const TOP_SONGS_LIMIT = 10;

function tabToPeriod(tab: TopSongsTab) {
  if (tab === 'Daily') {
    return 'day';
  }

  if (tab === 'Weekly') {
    return 'week';
  }

  return 'all';
}

export function useTopSongsScreen() {
  const [activeTab, setActiveTab] = useState<TopSongsTab>('Realtime');
  const [currentSongs, setCurrentSongs] = useState<Track[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isActive = true;

    async function load() {
      const songs = await fetchTopSongsByPeriod(tabToPeriod(activeTab), TOP_SONGS_LIMIT);
      if (isActive) {
        setCurrentSongs(songs);
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [activeTab, isFocused]);

  async function refresh() {
    startIndexing(true);
    const songs = await fetchTopSongsByPeriod(tabToPeriod(activeTab), TOP_SONGS_LIMIT);
    setCurrentSongs(songs);
  }

  function playAll() {
    if (currentSongs.length === 0) {
      return;
    }

    playTrack(currentSongs[0], currentSongs);
  }

  function shuffle() {
    if (currentSongs.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * currentSongs.length);
    playTrack(currentSongs[randomIndex], currentSongs);
  }

  return {
    activeTab,
    setActiveTab,
    currentSongs,
    refresh,
    playAll,
    shuffle,
  };
}
