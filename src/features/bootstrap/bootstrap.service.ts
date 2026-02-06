import { initializeTrackPlayer, registerPlaybackService } from '@/core/audio/track-player.service';
import { requestMediaLibraryPermission } from '@/core/storage/media-library.service';
import { scanMediaLibrary } from '@/features/indexer/indexer.service';

export async function bootstrapApp(): Promise<void> {
  registerPlaybackService();
  await initializeTrackPlayer();

  const { status } = await requestMediaLibraryPermission();
  if (status === 'granted') {
    void scanMediaLibrary(undefined, false);
  }
}
