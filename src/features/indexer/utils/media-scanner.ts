import * as MediaLibrary from "expo-media-library";
import { db } from "@/db/client";
import {
  tracks,
  artists,
  albums,
  genres,
  trackGenres,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { extractMetadata, saveArtworkToCache } from "./metadata-extractor";

const BATCH_SIZE = 10;

interface ScanProgress {
  phase: "scanning" | "processing" | "complete";
  current: number;
  total: number;
  currentFile: string;
}

export async function scanMediaLibrary(
  onProgress?: (progress: ScanProgress) => void,
  forceFullScan = false
): Promise<void> {
  // Get all audio assets
  const assets: MediaLibrary.Asset[] = [];
  let hasMore = true;
  let endCursor: string | undefined;

  while (hasMore) {
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 500,
      after: endCursor,
    });

    assets.push(...result.assets);
    hasMore = result.hasNextPage;
    endCursor = result.endCursor;
  }

  onProgress?.({
    phase: "scanning",
    current: 0,
    total: assets.length,
    currentFile: "",
  });

  // Get existing tracks to compare
  const existingTracks = await db.query.tracks.findMany({
    columns: { id: true, fileHash: true },
  });

  const existingTrackMap = new Map(existingTracks.map((t) => [t.id, t.fileHash]));
  const currentAssetIds = new Set(assets.map((a) => a.id));

  // Find deleted tracks
  const deletedTrackIds = existingTracks
    .filter((t) => !currentAssetIds.has(t.id))
    .map((t) => t.id);

  if (deletedTrackIds.length > 0) {
    await db
      .update(tracks)
      .set({ isDeleted: 1 })
      .where(inArray(tracks.id, deletedTrackIds));
  }

  // Filter assets to process
  const assetsToProcess = forceFullScan
    ? assets
    : assets.filter((asset) => {
        const existingHash = existingTrackMap.get(asset.id);
        const currentHash = generateFileHash(
          asset.uri,
          asset.modificationTime,
          asset.duration
        );
        return !existingHash || existingHash !== currentHash;
      });

  // Process in batches
  for (let i = 0; i < assetsToProcess.length; i += BATCH_SIZE) {
    const batch = assetsToProcess.slice(i, i + BATCH_SIZE);

    await processBatch(batch, (asset) => {
      onProgress?.({
        phase: "processing",
        current: i + batch.indexOf(asset) + 1,
        total: assetsToProcess.length,
        currentFile: asset.filename || "Unknown",
      });
    });
  }

  onProgress?.({
    phase: "complete",
    current: assetsToProcess.length,
    total: assetsToProcess.length,
    currentFile: "",
  });

  // Cleanup deleted tracks
  await db.delete(tracks).where(eq(tracks.isDeleted, 1));
}

async function processBatch(
  assets: MediaLibrary.Asset[],
  onFileStart?: (asset: MediaLibrary.Asset) => void
): Promise<void> {
  for (const asset of assets) {
    onFileStart?.(asset);

    try {
      const metadata = await extractMetadata(
        asset.uri,
        asset.filename || "",
        asset.duration
      );
      const artworkPath = await saveArtworkToCache(metadata.artwork, asset.id);

      // Get or create artist
      const artistId = metadata.artist
        ? await getOrCreateArtist(metadata.artist, metadata.artists)
        : null;

      // Get or create album
      const albumId =
        metadata.album && artistId
          ? await getOrCreateAlbum(
              metadata.album,
              artistId,
              artworkPath,
              metadata.year
            )
          : null;

      // Get or create genres
      const genreIds = await Promise.all(
        metadata.genres.map((g) => getOrCreateGenre(g))
      );

      // Insert track
      await db
        .insert(tracks)
        .values({
          id: asset.id,
          title: metadata.title,
          artistId,
          albumId,
          duration: metadata.duration,
          uri: asset.uri,
          trackNumber: metadata.trackNumber,
          discNumber: metadata.discNumber,
          year: metadata.year,
          filename: asset.filename || "",
          fileHash: generateFileHash(
            asset.uri,
            asset.modificationTime,
            asset.duration
          ),
          artwork: artworkPath,
          lyrics: metadata.lyrics || null,
          composer: metadata.composer || null,
          comment: metadata.comment || null,
          dateAdded: asset.creationTime || Date.now(),
          scanTime: Date.now(),
          isDeleted: 0,
          isFavorite: 0,
          playCount: 0,
          rating: null,
          lastPlayedAt: null,
        })
        .onConflictDoUpdate({
          target: tracks.id,
          set: {
            title: metadata.title,
            artistId,
            albumId,
            duration: metadata.duration,
            trackNumber: metadata.trackNumber,
            discNumber: metadata.discNumber,
            year: metadata.year,
            fileHash: generateFileHash(
              asset.uri,
              asset.modificationTime,
              asset.duration
            ),
            artwork: artworkPath,
            lyrics: metadata.lyrics || null,
            composer: metadata.composer || null,
            scanTime: Date.now(),
            isDeleted: 0,
          },
        });

      // Link genres
      if (genreIds.length > 0) {
        await db
          .delete(trackGenres)
          .where(eq(trackGenres.trackId, asset.id));

        await db.insert(trackGenres).values(
          genreIds.map((genreId) => ({
            trackId: asset.id,
            genreId,
          }))
        );
      }
    } catch (error) {
      console.error("Error processing track:", asset.filename, error);
    }
  }

  // Update denormalized counts
  await updateArtistCounts();
  await updateAlbumCounts();
  await updateGenreCounts();
}

async function getOrCreateArtist(
  name: string,
  allNames: string[]
): Promise<string> {
  const sortName = generateSortName(name);
  const existing = await db.query.artists.findFirst({
    where: eq(artists.name, name),
  });

  if (existing) {
    return existing.id;
  }

  const id = generateId();
  await db.insert(artists).values({
    id,
    name,
    sortName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return id;
}

async function getOrCreateAlbum(
  title: string,
  artistId: string,
  artwork?: string,
  year?: number
): Promise<string> {
  const existing = await db.query.albums.findFirst({
    where: and(eq(albums.title, title), eq(albums.artistId, artistId)),
  });

  if (existing) {
    return existing.id;
  }

  const id = generateId();
  await db.insert(albums).values({
    id,
    title,
    artistId,
    year: year || null,
    artwork: artwork || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return id;
}

async function getOrCreateGenre(name: string): Promise<string> {
  const existing = await db.query.genres.findFirst({
    where: eq(genres.name, name),
  });

  if (existing) {
    return existing.id;
  }

  const id = generateId();
  await db.insert(genres).values({
    id,
    name,
    createdAt: Date.now(),
  });

  return id;
}

async function updateArtistCounts(): Promise<void> {
  await db.run(sql`
    UPDATE artists 
    SET track_count = (
      SELECT COUNT(*) FROM tracks 
      WHERE tracks.artist_id = artists.id AND tracks.is_deleted = 0
    ),
    album_count = (
      SELECT COUNT(DISTINCT album_id) FROM tracks 
      WHERE tracks.artist_id = artists.id AND tracks.is_deleted = 0
    ),
    updated_at = ${Date.now()}
  `);
}

async function updateAlbumCounts(): Promise<void> {
  await db.run(sql`
    UPDATE albums 
    SET track_count = (
      SELECT COUNT(*) FROM tracks 
      WHERE tracks.album_id = albums.id AND tracks.is_deleted = 0
    ),
    duration = (
      SELECT COALESCE(SUM(duration), 0) FROM tracks 
      WHERE tracks.album_id = albums.id AND tracks.is_deleted = 0
    ),
    updated_at = ${Date.now()}
  `);
}

async function updateGenreCounts(): Promise<void> {
  await db.run(sql`
    UPDATE genres 
    SET track_count = (
      SELECT COUNT(*) FROM track_genres tg
      JOIN tracks t ON tg.track_id = t.id
      WHERE tg.genre_id = genres.id AND t.is_deleted = 0
    )
  `);
}

function generateFileHash(uri: string, modTime: number, size: number): string {
  return `${uri}-${modTime}-${size}`.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 64);
}

function generateSortName(name: string): string {
  const articles = ["The", "A", "An"];
  for (const article of articles) {
    if (name.startsWith(`${article} `)) {
      return `${name.slice(article.length + 1)}, ${article}`;
    }
  }
  return name;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
