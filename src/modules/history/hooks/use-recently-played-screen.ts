import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { startIndexing } from "@/modules/indexer";
import { playTrack } from "@/modules/player/player.store";
import type { Track } from "@/modules/player/player.types";
import { fetchRecentlyPlayedTracks } from "@/modules/history/history.utils";

const RECENTLY_PLAYED_QUERY_KEY = ["recently-played-screen"] as const;

export function useRecentlyPlayedScreen() {
  const isFocused = useIsFocused();
  const { data: history = [], refetch: refetchHistory } = useQuery<Track[]>({
    queryKey: RECENTLY_PLAYED_QUERY_KEY,
    queryFn: () => fetchRecentlyPlayedTracks(),
    enabled: false,
    initialData: [],
  });

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void refetchHistory();
  }, [isFocused, refetchHistory]);

  async function refresh() {
    startIndexing(true);
    await refetchHistory();
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
