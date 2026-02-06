import { useState } from 'react';
import type { Track } from '@/features/player/player.types';
import { useCreatePlaylist } from '@/features/library/api/use-library';
import {
  clampPlaylistDescription,
  clampPlaylistName,
  toggleTrackSelection,
} from '@/features/library/create-playlist.service';

export function useCreatePlaylistScreen(allTracks: Track[], onSaved: () => void) {
  const [name, setNameState] = useState('');
  const [description, setDescriptionState] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const createPlaylistMutation = useCreatePlaylist();

  function setName(value: string) {
    setNameState(clampPlaylistName(value));
  }

  function setDescription(value: string) {
    setDescriptionState(clampPlaylistDescription(value));
  }

  function toggleTrack(trackId: string) {
    setSelectedTracks((prev) => toggleTrackSelection(prev, trackId));
  }

  function toggleTrackPicker() {
    setShowTrackPicker((prev) => !prev);
  }

  async function save() {
    if (!name.trim() || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await createPlaylistMutation.mutateAsync({
        name,
        description,
        trackIds: Array.from(selectedTracks),
      });
      onSaved();
    } catch {
      setIsSaving(false);
    }
  }

  return {
    name,
    description,
    selectedTracks,
    showTrackPicker,
    isSaving,
    canSave: name.trim().length > 0,
    selectedTracksList: allTracks.filter((track) => selectedTracks.has(track.id)),
    setName,
    setDescription,
    toggleTrack,
    toggleTrackPicker,
    save,
  };
}
