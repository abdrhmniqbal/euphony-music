import type { Track } from "@/modules/player/player.types";

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

interface PlaylistTrackRelation {
  track: any;
}

interface PlaylistEntity {
  artwork?: string | null;
  tracks?: PlaylistTrackRelation[];
}

export function buildPlaylistTracks(playlist?: PlaylistEntity | null): Track[] {
  return (playlist?.tracks || []).map((playlistTrack) => {
    const track = playlistTrack.track;

    return {
      ...track,
      artist: typeof track.artist === "object" && track.artist ? track.artist.name : track.artist,
      album: typeof track.album === "object" && track.album ? track.album.title : track.album,
      image:
        track.image ||
        track.artwork ||
        (typeof track.album === "object" && track.album ? track.album.artwork : undefined),
    } as Track;
  });
}

export function buildPlaylistImages(playlist: PlaylistEntity | null | undefined, tracks: Track[]): string[] {
  const images = new Set<string>();

  if (playlist?.artwork) {
    images.add(playlist.artwork);
  }

  for (const track of tracks) {
    if (track.image) {
      images.add(track.image);
    }

    if (images.size >= 4) {
      break;
    }
  }

  return Array.from(images);
}

export function getPlaylistDuration(tracks: Track[]): number {
  return tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}
