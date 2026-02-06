import { TrackPlayer } from '@/features/player/player.service';
import { PlaybackService, setupPlayer } from '@/features/player/player.store';

let isPlaybackServiceRegistered = false;

export function registerPlaybackService(): void {
  if (isPlaybackServiceRegistered) {
    return;
  }

  try {
    TrackPlayer.registerPlaybackService(() => PlaybackService);
    isPlaybackServiceRegistered = true;
  } catch {
    // TrackPlayer throws when service is already registered.
    isPlaybackServiceRegistered = true;
  }
}

export async function initializeTrackPlayer(): Promise<void> {
  await setupPlayer();
}
