import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@nanostores/react";
import { useQuery } from "@tanstack/react-query";
import { useIsFavorite } from "@/modules/favorites/favorites.store";
import { getAllTracks } from "@/modules/player/player.api";
import { playTrack, type Track } from "@/modules/player/player.store";
import {
  $sortConfig,
  ALBUM_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
  setSortConfig,
  sortAlbums,
  sortTracks,
  type SortField,
} from "@/modules/library/library-sort.store";
import { type Album } from "@/components/blocks/album-grid";
import { buildArtistAlbums } from "../artists.utils";

const LIBRARY_TRACKS_QUERY_KEY = ["library", "tracks"] as const;

export function useArtistDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();

  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: LIBRARY_TRACKS_QUERY_KEY,
    queryFn: getAllTracks,
  });
  const allSortConfigs = useStore($sortConfig);
  const artistName = decodeURIComponent(name || "");

  const artistTracks = tracks.filter(
    (track) => track.artist?.toLowerCase() === artistName.toLowerCase(),
  );
  const artistId = artistTracks[0]?.artistId;
  const artistImage = artistTracks.find((track) => track.image)?.image;
  const isArtistFavorite = useIsFavorite(artistId || "", "artist");

  const albums = buildArtistAlbums(artistTracks);
  const sortedArtistTracks = sortTracks(artistTracks, allSortConfigs.ArtistTracks);
  const popularTracks = sortedArtistTracks.slice(0, 5);

  const sortedAlbums = sortAlbums(
    albums.map((album) => ({ ...album, id: album.title } as Album)),
    allSortConfigs.ArtistAlbums,
  );

  const [activeView, setActiveView] = useState<"overview" | "tracks" | "albums">("overview");
  const [navDirection, setNavDirection] = useState<"forward" | "back">("forward");
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const currentTab =
    activeView === "tracks"
      ? "ArtistTracks"
      : activeView === "albums"
        ? "ArtistAlbums"
        : "ArtistTracks";
  const sortConfig = allSortConfigs[currentTab];

  function navigateTo(view: "overview" | "tracks" | "albums") {
    if (view === "overview") {
      setNavDirection("back");
    } else {
      setNavDirection("forward");
    }

    setActiveView(view);
  }

  function playArtistTrack(track: Track) {
    playTrack(track, sortedArtistTracks);
  }

  function playAllTracks() {
    if (artistTracks.length > 0) {
      playTrack(artistTracks[0], sortedArtistTracks);
    }
  }

  function shuffleTracks() {
    if (artistTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * artistTracks.length);
      playTrack(artistTracks[randomIndex], sortedArtistTracks);
    }
  }

  function openAlbum(album: Album) {
    router.push(`../album/${encodeURIComponent(album.title)}`);
  }

  function selectSort(field: SortField, order?: "asc" | "desc") {
    setSortConfig(currentTab, field, order);
  }

  function getSortLabel() {
    const options = activeView === "tracks" ? TRACK_SORT_OPTIONS : ALBUM_SORT_OPTIONS;
    return options.find((option) => option.field === sortConfig.field)?.label || "Sort";
  }

  return {
    name: artistName,
    artistTracks,
    artistId,
    artistImage,
    isArtistFavorite,
    albums,
    sortedArtistTracks,
    popularTracks,
    sortedAlbums,
    activeView,
    navDirection,
    sortModalVisible,
    setSortModalVisible,
    sortConfig,
    navigateTo,
    playArtistTrack,
    playAllTracks,
    shuffleTracks,
    openAlbum,
    selectSort,
    getSortLabel,
  };
}
