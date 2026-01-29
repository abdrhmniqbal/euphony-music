import * as SQLite from 'expo-sqlite';
import { Track } from '@/store/player-store';

export const db = SQLite.openDatabaseSync('emp_music.db');

export const initDatabase = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT,
            album TEXT,
            duration REAL,
            uri TEXT NOT NULL,
            image TEXT,
            lyrics TEXT,
            file_hash TEXT,
            scan_time INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            play_count INTEGER DEFAULT 0,
            last_played_at INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_tracks_file_hash ON tracks(file_hash);
        CREATE INDEX IF NOT EXISTS idx_tracks_is_deleted ON tracks(is_deleted);
        
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            track_id TEXT,
            timestamp INTEGER,
            FOREIGN KEY(track_id) REFERENCES tracks(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);
        
        CREATE TABLE IF NOT EXISTS artwork (
            hash TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            mime_type TEXT DEFAULT 'image/jpeg',
            source TEXT DEFAULT 'embedded',
            created_at INTEGER DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS indexer_state (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at INTEGER DEFAULT 0
        );
    `);

    runMigrations();
};

const runMigrations = () => {
    const tableInfo: any[] = db.getAllSync('PRAGMA table_info(tracks)');
    const columns = new Set(tableInfo.map(col => col.name));

    if (!columns.has('lyrics')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN lyrics TEXT');
    }
    if (!columns.has('album')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN album TEXT');
    }
    if (!columns.has('scan_time')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN scan_time INTEGER DEFAULT 0');
    }
    if (!columns.has('file_hash')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN file_hash TEXT');
    }
    if (!columns.has('is_deleted')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN is_deleted INTEGER DEFAULT 0');
    }
    if (!columns.has('play_count')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN play_count INTEGER DEFAULT 0');
    }
    if (!columns.has('last_played_at')) {
        db.execSync('ALTER TABLE tracks ADD COLUMN last_played_at INTEGER DEFAULT 0');
    }
};

export const addToHistory = (trackId: string) => {
    const timestamp = Date.now();
    db.runSync(
        'INSERT OR REPLACE INTO history (id, track_id, timestamp) VALUES (?, ?, ?)',
        [`${trackId}-${timestamp}`, trackId, timestamp]
    );
    db.runSync(`
        DELETE FROM history 
        WHERE id NOT IN (
            SELECT id FROM history ORDER BY timestamp DESC LIMIT 50
        )
    `);
};

export const getHistory = (): Track[] => {
    const rows = db.getAllSync(`
        SELECT t.* 
        FROM history h 
        JOIN tracks t ON h.track_id = t.id 
        WHERE t.is_deleted = 0
        ORDER BY h.timestamp DESC
    `) as any[];

    return rows.map(mapRowToTrack);
};

const mapRowToTrack = (row: any): Track => ({
    id: row.id,
    title: row.title,
    artist: row.artist || undefined,
    album: row.album || undefined,
    duration: row.duration,
    uri: row.uri,
    image: row.image || undefined,
    lyrics: row.lyrics ? JSON.parse(row.lyrics) : undefined,
    fileHash: row.file_hash || undefined,
    scanTime: row.scan_time || 0,
    isDeleted: row.is_deleted === 1,
    playCount: row.play_count || 0,
    lastPlayedAt: row.last_played_at || 0,
});

export const getTracksFromDB = (): Track[] => {
    const rows = db.getAllSync('SELECT * FROM tracks WHERE is_deleted = 0') as any[];
    return rows.map(mapRowToTrack);
};

export const getTrackById = (id: string): Track | null => {
    const rows = db.getAllSync('SELECT * FROM tracks WHERE id = ?', [id]) as any[];
    if (rows.length === 0) return null;
    return mapRowToTrack(rows[0]);
};

export const getAllTrackIds = (): string[] => {
    const rows = db.getAllSync('SELECT id FROM tracks') as { id: string }[];
    return rows.map(r => r.id);
};

export const upsertTrack = (track: Track) => {
    db.runSync(
        `INSERT OR REPLACE INTO tracks 
            (id, title, artist, album, duration, uri, image, lyrics, file_hash, scan_time, is_deleted, play_count, last_played_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            track.id,
            track.title,
            track.artist || null,
            track.album || null,
            track.duration,
            track.uri,
            track.image || null,
            track.lyrics ? JSON.stringify(track.lyrics) : null,
            track.fileHash || null,
            track.scanTime || Date.now(),
            track.isDeleted ? 1 : 0,
            track.playCount || 0,
            track.lastPlayedAt || 0,
        ]
    );
};

export const insertTracksToDB = (tracks: Track[]) => {
    db.withTransactionSync(() => {
        for (const track of tracks) {
            upsertTrack(track);
        }
    });
};

export const markTrackDeleted = (id: string) => {
    db.runSync('UPDATE tracks SET is_deleted = 1 WHERE id = ?', [id]);
};

export const cleanupDeletedTracks = () => {
    db.runSync('DELETE FROM tracks WHERE is_deleted = 1');
};

export const clearTracksDB = () => {
    db.runSync('DELETE FROM tracks');
};

export const clearTrackById = (id: string) => {
    db.runSync('DELETE FROM tracks WHERE id = ?', [id]);
};

export const getTrackCount = (): number => {
    const result = db.getFirstSync('SELECT COUNT(*) as count FROM tracks WHERE is_deleted = 0') as { count: number };
    return result?.count || 0;
};

export const hasExistingLibrary = (): boolean => {
    return getTrackCount() > 0;
};

export const getIndexerState = (key: string): string | null => {
    const row = db.getFirstSync(
        'SELECT value FROM indexer_state WHERE key = ?',
        [key]
    ) as { value: string } | null;
    return row?.value || null;
};

export const setIndexerState = (key: string, value: string): void => {
    db.runSync(
        'INSERT OR REPLACE INTO indexer_state (key, value, updated_at) VALUES (?, ?, ?)',
        [key, value, Date.now()]
    );
};

export interface ArtworkEntry {
    hash: string;
    path: string;
    mimeType: string;
    source: 'embedded' | 'folder' | 'downloaded';
    createdAt: number;
}

export const getArtworkByHash = (hash: string): ArtworkEntry | null => {
    const row = db.getFirstSync(
        'SELECT * FROM artwork WHERE hash = ?',
        [hash]
    ) as any;
    if (!row) return null;
    return {
        hash: row.hash,
        path: row.path,
        mimeType: row.mime_type,
        source: row.source,
        createdAt: row.created_at,
    };
};

export const upsertArtwork = (entry: ArtworkEntry): void => {
    db.runSync(
        `INSERT OR REPLACE INTO artwork (hash, path, mime_type, source, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [entry.hash, entry.path, entry.mimeType, entry.source, entry.createdAt || Date.now()]
    );
};

export const batchUpsertTracks = (tracks: Track[]): void => {
    if (tracks.length === 0) return;
    db.withTransactionSync(() => {
        for (const track of tracks) {
            db.runSync(
                `INSERT OR REPLACE INTO tracks 
                    (id, title, artist, album, duration, uri, image, lyrics, file_hash, scan_time, is_deleted, play_count, last_played_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    track.id,
                    track.title,
                    track.artist || null,
                    track.album || null,
                    track.duration,
                    track.uri,
                    track.image || null,
                    track.lyrics ? JSON.stringify(track.lyrics) : null,
                    track.fileHash || null,
                    track.scanTime || Date.now(),
                    track.isDeleted ? 1 : 0,
                    track.playCount || 0,
                    track.lastPlayedAt || 0,
                ]
            );
        }
    });
};

export const incrementPlayCount = (trackId: string) => {
    const timestamp = Date.now();
    db.runSync(
        `UPDATE tracks 
         SET play_count = play_count + 1, last_played_at = ? 
         WHERE id = ?`,
        [timestamp, trackId]
    );
    addToHistory(trackId);
};

export const getTopSongs = (period: 'all' | 'day' | 'week', limit: number = 25): Track[] => {
    let query = '';
    const now = Date.now();

    if (period === 'all') {
        query = `
            SELECT * FROM tracks 
            WHERE is_deleted = 0 AND play_count > 0
            ORDER BY play_count DESC, last_played_at DESC 
            LIMIT ?
        `;
        const rows = db.getAllSync(query, [limit]) as any[];
        return rows.map(mapRowToTrack);
    } else {
        const timeThreshold = period === 'day'
            ? now - 24 * 60 * 60 * 1000
            : now - 7 * 24 * 60 * 60 * 1000;

        query = `
            SELECT t.*, COUNT(h.id) as period_play_count
            FROM history h
            JOIN tracks t ON h.track_id = t.id
            WHERE h.timestamp >= ? AND t.is_deleted = 0
            GROUP BY t.id
            ORDER BY period_play_count DESC, t.last_played_at DESC
            LIMIT ?
        `;
        const rows = db.getAllSync(query, [timeThreshold, limit]) as any[];
        return rows.map(mapRowToTrack);
    }
};
