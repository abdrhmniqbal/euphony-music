import { sql } from "drizzle-orm"
import { db } from "@/db/client"

export async function updateArtistCounts(): Promise<void> {
  await db.run(sql`
    UPDATE artists 
    SET track_count = (
      SELECT COUNT(DISTINCT t.id)
      FROM tracks t
      JOIN track_artists ta ON ta.track_id = t.id
      WHERE ta.artist_id = artists.id AND t.is_deleted = 0
    ),
    album_count = (
      SELECT COUNT(DISTINCT t.album_id)
      FROM tracks t
      JOIN track_artists ta ON ta.track_id = t.id
      WHERE ta.artist_id = artists.id AND t.is_deleted = 0
    ),
    artwork = CASE 
      WHEN artists.artwork LIKE 'http%' THEN artists.artwork
      ELSE COALESCE(
        (
          SELECT t.artwork FROM tracks t
          WHERE t.artist_id = artists.id
            AND t.is_deleted = 0
            AND t.artwork IS NOT NULL
          ORDER BY COALESCE(t.last_played_at, 0) DESC, COALESCE(t.date_added, 0) DESC
          LIMIT 1
        ),
        (
          SELECT a.artwork FROM tracks t
          JOIN track_artists ta ON ta.track_id = t.id
          JOIN albums a ON a.id = t.album_id
          WHERE ta.artist_id = artists.id
            AND t.artist_id != artists.id
            AND t.is_deleted = 0
            AND a.artwork IS NOT NULL
          ORDER BY COALESCE(t.last_played_at, 0) DESC, COALESCE(t.date_added, 0) DESC
          LIMIT 1
        ),
        (
          SELECT a.artwork FROM tracks t
          JOIN albums a ON a.id = t.album_id
          WHERE t.artist_id = artists.id
            AND t.is_deleted = 0
            AND a.artwork IS NOT NULL
          ORDER BY COALESCE(t.last_played_at, 0) DESC, COALESCE(t.date_added, 0) DESC
          LIMIT 1
        ),
        artists.artwork
      )
    END,
    updated_at = ${Date.now()}
  `)
}

export async function updateAlbumCounts(): Promise<void> {
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
    artwork = COALESCE(
      (
        SELECT t.artwork
        FROM tracks t
        WHERE t.album_id = albums.id
          AND t.is_deleted = 0
          AND t.artwork IS NOT NULL
        GROUP BY t.artwork
        ORDER BY COUNT(*) DESC, COALESCE(MAX(t.date_added), 0) DESC
        LIMIT 1
      ),
      albums.artwork
    ),
    updated_at = ${Date.now()}
  `)
}

export async function updateGenreCounts(): Promise<void> {
  await db.run(sql`
    UPDATE genres 
    SET track_count = (
      SELECT COUNT(*) FROM track_genres tg
      JOIN tracks t ON tg.track_id = t.id
      WHERE tg.genre_id = genres.id AND t.is_deleted = 0
    )
  `)
}
