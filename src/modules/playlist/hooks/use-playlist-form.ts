import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { getAllTracks } from "@/modules/player/player.api";
import type { Track } from "@/modules/player/player.types";
import {
  createPlaylist,
  updatePlaylist,
} from "@/modules/playlist/playlist.api";
import { usePlaylist } from "@/modules/playlist/playlist.queries";
import {
  clampPlaylistDescription,
  clampPlaylistName,
  toggleTrackSelection,
} from "@/modules/playlist/playlist.utils";

const SEARCH_DEBOUNCE_MS = 140;
const LIBRARY_TRACKS_QUERY_KEY = ["library", "tracks"] as const;
const PLAYLISTS_QUERY_KEY = ["playlists"] as const;

type PlaylistFormPayload = {
  id?: string;
  name: string;
  description?: string;
  trackIds: string[];
};

export function usePlaylistFormScreen(
  onSaved: () => void,
  playlistId?: string,
) {
  const normalizedPlaylistId = playlistId?.trim() ?? "";
  const isEditMode = normalizedPlaylistId.length > 0;
  const queryClient = useQueryClient();
  const [name, setNameState] = useState("");
  const [description, setDescriptionState] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isTrackSheetOpen, setTrackSheetOpen] = useState(false);
  const [searchInputKey, setSearchInputKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasInitializedEditState, setHasInitializedEditState] = useState(false);

  const { data: playlistToEdit, isLoading: isEditPlaylistLoading } = usePlaylist(
    normalizedPlaylistId,
    isEditMode,
  );

  const savePlaylistMutation = useMutation({
    mutationFn: async (payload: PlaylistFormPayload) => {
      if (payload.id) {
        await updatePlaylist(
          payload.id,
          payload.name,
          payload.description,
          payload.trackIds,
        );
        return;
      }

      await createPlaylist(payload.name, payload.description, payload.trackIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
      if (isEditMode) {
        queryClient.invalidateQueries({
          queryKey: [PLAYLISTS_QUERY_KEY[0], normalizedPlaylistId],
        });
      }
    },
  });

  const { data: allTracks = [] } = useQuery<Track[]>({
    queryKey: LIBRARY_TRACKS_QUERY_KEY,
    queryFn: getAllTracks,
  });
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, {
    wait: SEARCH_DEBOUNCE_MS,
  });

  useEffect(() => {
    setNameState("");
    setDescriptionState("");
    setSelectedTracks(new Set());

    if (!isEditMode) {
      setHasInitializedEditState(true);
      return;
    }

    setHasInitializedEditState(false);
  }, [isEditMode, normalizedPlaylistId]);

  useEffect(() => {
    if (!isEditMode || hasInitializedEditState || isEditPlaylistLoading) {
      return;
    }

    if (!playlistToEdit) {
      setHasInitializedEditState(true);
      return;
    }

    setNameState(clampPlaylistName(playlistToEdit.name));
    setDescriptionState(clampPlaylistDescription(playlistToEdit.description || ""));
    setSelectedTracks(
      new Set((playlistToEdit.tracks || []).map((playlistTrack) => playlistTrack.trackId)),
    );
    setHasInitializedEditState(true);
  }, [isEditMode, hasInitializedEditState, isEditPlaylistLoading, playlistToEdit]);

  function setName(value: string) {
    setNameState(clampPlaylistName(value));
  }

  function setDescription(value: string) {
    setDescriptionState(clampPlaylistDescription(value));
  }

  function toggleTrack(trackId: string) {
    setSelectedTracks((prev) => toggleTrackSelection(prev, trackId));
  }

  function openTrackSheet() {
    setTrackSheetOpen(true);
  }

  function handleTrackSheetOpenChange(open: boolean) {
    setTrackSheetOpen(open);
    if (!open) {
      setSearchQuery("");
      setSearchInputKey((prev) => prev + 1);
    }
  }

  async function save() {
    if (
      !name.trim() ||
      savePlaylistMutation.isPending ||
      (isEditMode && !playlistToEdit)
    ) {
      return;
    }

    try {
      await savePlaylistMutation.mutateAsync({
        id: isEditMode ? normalizedPlaylistId : undefined,
        name,
        description: description.trim().length > 0 ? description : undefined,
        trackIds: Array.from(selectedTracks),
      });
      onSaved();
    } catch {
      // Keep screen state intact when save fails.
    }
  }

  const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();
  const filteredTracks =
    normalizedQuery.length === 0
      ? allTracks
      : allTracks.filter((track) => {
          const title = track.title.toLowerCase();
          const artist = (track.artist || "").toLowerCase();
          const album = (track.album || "").toLowerCase();
          return (
            title.includes(normalizedQuery) ||
            artist.includes(normalizedQuery) ||
            album.includes(normalizedQuery)
          );
        });

  return {
    name,
    description,
    selectedTracks,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    filteredTracks,
    isEditMode,
    isSaving: savePlaylistMutation.isPending,
    canSave:
      name.trim().length > 0 &&
      !savePlaylistMutation.isPending &&
      (!isEditMode || Boolean(playlistToEdit)),
    selectedTracksList: allTracks.filter((track) =>
      selectedTracks.has(track.id),
    ),
    setName,
    setDescription,
    setSearchQuery,
    toggleTrack,
    openTrackSheet,
    handleTrackSheetOpenChange,
    save,
  };
}
