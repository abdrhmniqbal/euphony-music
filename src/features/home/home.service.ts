import { getHistory, getTopSongs } from '@/db/operations';
import type { Track } from '@/features/player/player.types';

export type HomeTopSongsPeriod = 'all' | 'day' | 'week';

export function dedupeTracksById(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (seen.has(track.id)) {
      return false;
    }

    seen.add(track.id);
    return true;
  });
}

export async function fetchRecentlyPlayedTracks(limit = 8): Promise<Track[]> {
  const history = await getHistory();
  return dedupeTracksById(history).slice(0, limit);
}

export async function fetchTopSongsByPeriod(
  period: HomeTopSongsPeriod,
  limit: number,
): Promise<Track[]> {
  return getTopSongs(period, limit);
}
