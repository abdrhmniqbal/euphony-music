export const MAX_PLAYLIST_NAME_LENGTH = 20;
export const MAX_PLAYLIST_DESCRIPTION_LENGTH = 40;

export function toggleTrackSelection(current: Set<string>, trackId: string): Set<string> {
  const next = new Set(current);

  if (next.has(trackId)) {
    next.delete(trackId);
  } else {
    next.add(trackId);
  }

  return next;
}

export function clampPlaylistName(value: string): string {
  return value.slice(0, MAX_PLAYLIST_NAME_LENGTH);
}

export function clampPlaylistDescription(value: string): string {
  return value.slice(0, MAX_PLAYLIST_DESCRIPTION_LENGTH);
}
