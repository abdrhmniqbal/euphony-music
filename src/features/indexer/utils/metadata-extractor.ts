import * as FileSystem from 'expo-file-system';
import { db } from "@/db/client";
import { artworkCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMetadata, getArtwork } from "@missingcore/react-native-metadata-retriever";

export interface ExtractedMetadata {
  title: string;
  artist?: string;
  artists: string[];
  album?: string;
  albumArtist?: string;
  genres: string[];
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  duration: number;
  composer?: string;
  comment?: string;
  lyrics?: string;
  artwork?: string;
}

const ARTWORK_DIR_NAME = "artwork";

// Define the fields we want to extract
const metadataFields = [
  "title",
  "artist",
  "albumArtist",
  "albumTitle",
  "trackNumber",
  "discNumber",
  "genre",
  "composer",
  "description",
  "year",
  "artworkData",
] as const;

export async function extractMetadata(
  uri: string,
  filename: string,
  duration: number
): Promise<ExtractedMetadata> {
  try {
    // Get metadata from the file
    const metadata = await getMetadata(uri, metadataFields);
    
    // Get artwork separately
    const artwork = await getArtwork(uri).catch(() => null);

    return {
      title: metadata.title || cleanFilename(filename),
      artist: metadata.artist || undefined,
      artists: metadata.artist ? parseMultiValue(metadata.artist) : [],
      album: metadata.albumTitle || undefined,
      albumArtist: metadata.albumArtist || metadata.artist || undefined,
      genres: metadata.genre ? parseMultiValue(metadata.genre) : [],
      year: metadata.year || undefined,
      trackNumber: metadata.trackNumber || undefined,
      discNumber: metadata.discNumber || undefined,
      duration,
      composer: metadata.composer || undefined,
      comment: metadata.description || undefined,
      lyrics: undefined,
      artwork: artwork || undefined,
    };
  } catch (error) {
    console.warn("Failed to extract metadata:", error);
    return {
      title: cleanFilename(filename),
      artists: [],
      genres: [],
      duration,
    };
  }
}

export async function saveArtworkToCache(
  artworkData: string | undefined,
  trackId: string
): Promise<string | undefined> {
  if (!artworkData) return undefined;

  try {
    // If already a file path, return as-is
    if (artworkData.startsWith("file://") || artworkData.startsWith("/")) {
      return artworkData;
    }

    // Generate hash from artwork data
    const hash = generateArtworkHash(artworkData);

    // Check if already cached
    const existing = await db.query.artworkCache.findFirst({
      where: eq(artworkCache.hash, hash),
    });

    if (existing) {
      const fileInfo = await FileSystem.getInfoAsync(existing.path);
      if (fileInfo.exists) {
        return existing.path;
      }
    }

    // Save to cache directory
    const cacheDir = `${FileSystem.cacheDirectory}${ARTWORK_DIR_NAME}`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const artworkPath = `${cacheDir}/${hash}.jpg`;

    // Remove data URI prefix if present
    let base64Data = artworkData;
    if (artworkData.startsWith("data:")) {
      base64Data = artworkData.split(",")[1] || "";
    }

    if (!base64Data) return undefined;

    await FileSystem.writeAsStringAsync(artworkPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Save to database
    await db.insert(artworkCache).values({
      hash,
      path: artworkPath,
      mimeType: "image/jpeg",
      source: "embedded",
      createdAt: Date.now(),
    });

    return artworkPath;
  } catch (error) {
    console.warn("Failed to save artwork:", error);
    return undefined;
  }
}

// Parse multi-value fields (semicolon or slash delimited)
function parseMultiValue(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[;\/]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function cleanFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
}

function generateArtworkHash(data: string): string {
  const sample = data.slice(0, 1024);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) - hash) + sample.charCodeAt(i);
    hash |= 0;
  }
  return `${Math.abs(hash).toString(16)}_${data.length}`;
}