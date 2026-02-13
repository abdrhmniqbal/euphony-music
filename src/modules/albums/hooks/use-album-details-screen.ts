import { useLocalSearchParams } from "expo-router";
import { useStore } from "@nanostores/react";
import { useQuery } from "@tanstack/react-query";
import { useIsFavorite } from "@/modules/favorites/favorites.store";
import { getAllTracks } from "@/modules/player/player.api";
import { playTrack, type Track } from "@/modules/player/player.store";
import {
  $sortConfig,
  setSortConfig,
  TRACK_SORT_OPTIONS,
  sortTracks,
  type SortField,
} from "@/modules/library/library-sort.store";
import {
  formatAlbumDuration,
  groupTracksByDisc,
  sortTracksByDiscAndTrack,
} from "../albums.utils";

const LIBRARY_TRACKS_QUERY_KEY = ["library", "tracks"] as const;

export function useAlbumDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: LIBRARY_TRACKS_QUERY_KEY,
    queryFn: getAllTracks,
  });
  const allSortConfigs = useStore($sortConfig);

  const albumName = decodeURIComponent(name || "");

  const albumTracks = tracks.filter(
    (track) => track.album?.toLowerCase() === albumName.toLowerCase(),
  );

  const albumInfo = (() => {
    if (albumTracks.length === 0) {
      return null;
    }

    const firstTrack = albumTracks[0];
    return {
      title: firstTrack.album || "Unknown Album",
      artist: firstTrack.albumArtist || firstTrack.artist || "Unknown Artist",
      image: firstTrack.image,
      year: firstTrack.year,
    };
  })();

  const totalDuration = albumTracks.reduce(
    (sum, track) => sum + (track.duration || 0),
    0,
  );
  const sortConfig = allSortConfigs.AlbumTracks || {
    field: "title" as SortField,
    order: "asc" as const,
  };

  const sortedTracks =
    sortConfig.field !== "title" || sortConfig.order !== "asc"
      ? sortTracks(albumTracks, sortConfig)
      : sortTracksByDiscAndTrack(albumTracks);

  const tracksByDisc = groupTracksByDisc(sortedTracks);
  const albumId = albumTracks[0]?.albumId;
  const isAlbumFavorite = useIsFavorite(albumId || "", "album");

  function playSelectedTrack(track: Track) {
    playTrack(track, sortedTracks);
  }

  function playAllTracks() {
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0], sortedTracks);
    }
  }

  function shuffleTracks() {
    if (sortedTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * sortedTracks.length);
      playTrack(sortedTracks[randomIndex], sortedTracks);
    }
  }

  function selectSort(field: SortField, order?: "asc" | "desc") {
    setSortConfig("AlbumTracks", field, order);
  }

  function getSortLabel() {
    const option = TRACK_SORT_OPTIONS.find(
      (item) => item.field === sortConfig.field,
    );
    return option?.label || "Sort";
  }

  return {
    albumInfo,
    albumId,
    isAlbumFavorite,
    tracksByDisc,
    sortedTracks,
    sortConfig,
    totalDurationLabel: formatAlbumDuration(totalDuration),
    playSelectedTrack,
    playAllTracks,
    shuffleTracks,
    selectSort,
    getSortLabel,
  };
}
