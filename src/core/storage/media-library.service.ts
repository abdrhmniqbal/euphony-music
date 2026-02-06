import * as MediaLibrary from 'expo-media-library';

export async function requestMediaLibraryPermission() {
  return MediaLibrary.requestPermissionsAsync();
}
