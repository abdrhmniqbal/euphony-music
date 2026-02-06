import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from "react-native";
import { db } from "@/db/client";
import { loadFavorites } from "@/features/favorites/favorites.store";
import { loadTracks } from "@/features/player/player.store";

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        // Check if tables exist by trying to query
        await db.query.appSettings.findFirst();
        // Tables exist, load data
        await loadData();
        setReady(true);
      } catch (e) {
        // Tables don't exist, need to create them
        try {
          await createTables();
          // After creating tables, load data
          await loadData();
          setReady(true);
        } catch (createError) {
          setError(createError as Error);
        }
      }
    };

    initDatabase();
  }, []);
  
  async function loadData() {
    try {
      await loadFavorites();
      await loadTracks();
    } catch (e) {
    }
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-danger text-center mb-2">Database Error</Text>
        <Text className="text-muted-foreground text-center text-sm">
          {error.message}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary mb-4" />
        <Text className="text-foreground">Initializing database...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

async function createTables() {
  // 1. artists (with is_favorite, favorited_at)
  await db.run(`
    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_name TEXT,
      artwork TEXT,
      bio TEXT,
      track_count INTEGER DEFAULT 0,
      album_count INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      favorited_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS artists_name_idx ON artists (name);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS artists_sort_name_idx ON artists (sort_name);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS artists_favorite_idx ON artists (is_favorite);
  `);

  // 2. albums (with is_favorite, favorited_at)
  await db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist_id TEXT,
      year INTEGER,
      artwork TEXT,
      total_tracks INTEGER,
      disc_count INTEGER,
      track_count INTEGER DEFAULT 0,
      duration REAL,
      is_favorite INTEGER DEFAULT 0,
      favorited_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE SET NULL
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS albums_title_idx ON albums (title);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS albums_artist_idx ON albums (artist_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS albums_year_idx ON albums (year);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS albums_favorite_idx ON albums (is_favorite);
  `);

  // 3. genres
  await db.run(`
    CREATE TABLE IF NOT EXISTS genres (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      track_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS genres_name_idx ON genres (name);
  `);

  // 4. tracks (with is_favorite, favorited_at)
  await db.run(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist_id TEXT,
      album_id TEXT,
      duration REAL NOT NULL,
      uri TEXT NOT NULL,
      filename TEXT,
      file_hash TEXT,
      track_number INTEGER,
      disc_number INTEGER,
      year INTEGER,
      play_count INTEGER DEFAULT 0,
      last_played_at INTEGER,
      is_favorite INTEGER DEFAULT 0,
      favorited_at INTEGER,
      rating INTEGER,
      date_added INTEGER,
      is_deleted INTEGER DEFAULT 0,
      scan_time INTEGER,
      lyrics TEXT,
      composer TEXT,
      comment TEXT,
      artwork TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE SET NULL,
      FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE SET NULL
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_artist_idx ON tracks (artist_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_album_idx ON tracks (album_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_title_idx ON tracks (title);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_favorite_idx ON tracks (is_favorite);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_deleted_idx ON tracks (is_deleted);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_play_count_idx ON tracks (play_count);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS tracks_last_played_idx ON tracks (last_played_at);
  `);

  // 5. track_genres
  await db.run(`
    CREATE TABLE IF NOT EXISTS track_genres (
      track_id TEXT NOT NULL,
      genre_id TEXT NOT NULL,
      PRIMARY KEY (track_id, genre_id),
      FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE,
      FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS track_genres_track_idx ON track_genres (track_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS track_genres_genre_idx ON track_genres (genre_id);
  `);

  // 6. track_artists
  await db.run(`
    CREATE TABLE IF NOT EXISTS track_artists (
      track_id TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      role TEXT DEFAULT 'featured',
      PRIMARY KEY (track_id, artist_id),
      FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE,
      FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS track_artists_track_idx ON track_artists (track_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS track_artists_artist_idx ON track_artists (artist_id);
  `);

  // 7. playlists (with is_favorite, favorited_at)
  await db.run(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      artwork TEXT,
      track_count INTEGER DEFAULT 0,
      duration REAL,
      is_favorite INTEGER DEFAULT 0,
      favorited_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 8. playlist_tracks
  await db.run(`
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      added_at INTEGER NOT NULL,
      FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS playlist_tracks_playlist_idx ON playlist_tracks (playlist_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS playlist_tracks_track_idx ON playlist_tracks (track_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS playlist_tracks_position_idx ON playlist_tracks (playlist_id, position);
  `);

  // 9. play_history
  await db.run(`
    CREATE TABLE IF NOT EXISTS play_history (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      played_at INTEGER NOT NULL,
      duration REAL,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS play_history_track_idx ON play_history (track_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS play_history_played_at_idx ON play_history (played_at);
  `);

  // 10. artwork_cache
  await db.run(`
    CREATE TABLE IF NOT EXISTS artwork_cache (
      hash TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      mime_type TEXT DEFAULT 'image/jpeg',
      width INTEGER,
      height INTEGER,
      size INTEGER,
      source TEXT DEFAULT 'embedded',
      created_at INTEGER NOT NULL
    );
  `);

  // 11. indexer_state
  await db.run(`
    CREATE TABLE IF NOT EXISTS indexer_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 12. app_settings
  await db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}
