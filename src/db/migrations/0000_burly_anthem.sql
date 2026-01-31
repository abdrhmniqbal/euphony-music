CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist_id` text,
	`year` integer,
	`artwork` text,
	`total_tracks` integer,
	`disc_count` integer,
	`track_count` integer DEFAULT 0,
	`duration` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `albums_title_idx` ON `albums` (`title`);--> statement-breakpoint
CREATE INDEX `albums_artist_idx` ON `albums` (`artist_id`);--> statement-breakpoint
CREATE INDEX `albums_year_idx` ON `albums` (`year`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_name` text,
	`artwork` text,
	`bio` text,
	`track_count` integer DEFAULT 0,
	`album_count` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `artists_name_idx` ON `artists` (`name`);--> statement-breakpoint
CREATE INDEX `artists_sort_name_idx` ON `artists` (`sort_name`);--> statement-breakpoint
CREATE TABLE `artwork_cache` (
	`hash` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`mime_type` text DEFAULT 'image/jpeg',
	`width` integer,
	`height` integer,
	`size` integer,
	`source` text DEFAULT 'embedded',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`item_id` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text,
	`artwork` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `favorites_type_idx` ON `favorites` (`type`);--> statement-breakpoint
CREATE INDEX `favorites_item_idx` ON `favorites` (`type`,`item_id`);--> statement-breakpoint
CREATE INDEX `favorites_created_at_idx` ON `favorites` (`created_at`);--> statement-breakpoint
CREATE TABLE `genres` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`track_count` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genres_name_unique` ON `genres` (`name`);--> statement-breakpoint
CREATE INDEX `genres_name_idx` ON `genres` (`name`);--> statement-breakpoint
CREATE TABLE `indexer_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `play_history` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`played_at` integer NOT NULL,
	`duration` real,
	`completed` integer DEFAULT 0,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `play_history_track_idx` ON `play_history` (`track_id`);--> statement-breakpoint
CREATE INDEX `play_history_played_at_idx` ON `play_history` (`played_at`);--> statement-breakpoint
CREATE TABLE `playlist_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`playlist_id` text NOT NULL,
	`track_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_tracks_playlist_idx` ON `playlist_tracks` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `playlist_tracks_track_idx` ON `playlist_tracks` (`track_id`);--> statement-breakpoint
CREATE INDEX `playlist_tracks_position_idx` ON `playlist_tracks` (`playlist_id`,`position`);--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`artwork` text,
	`track_count` integer DEFAULT 0,
	`duration` real,
	`is_favorite` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `track_artists` (
	`track_id` text NOT NULL,
	`artist_id` text NOT NULL,
	`role` text DEFAULT 'featured',
	PRIMARY KEY(`track_id`, `artist_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `track_artists_track_idx` ON `track_artists` (`track_id`);--> statement-breakpoint
CREATE INDEX `track_artists_artist_idx` ON `track_artists` (`artist_id`);--> statement-breakpoint
CREATE TABLE `track_genres` (
	`track_id` text NOT NULL,
	`genre_id` text NOT NULL,
	PRIMARY KEY(`track_id`, `genre_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `track_genres_track_idx` ON `track_genres` (`track_id`);--> statement-breakpoint
CREATE INDEX `track_genres_genre_idx` ON `track_genres` (`genre_id`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist_id` text,
	`album_id` text,
	`duration` real NOT NULL,
	`uri` text NOT NULL,
	`filename` text,
	`file_hash` text,
	`track_number` integer,
	`disc_number` integer,
	`year` integer,
	`play_count` integer DEFAULT 0,
	`last_played_at` integer,
	`is_favorite` integer DEFAULT 0,
	`rating` integer,
	`date_added` integer,
	`is_deleted` integer DEFAULT 0,
	`scan_time` integer,
	`lyrics` text,
	`composer` text,
	`comment` text,
	`artwork` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tracks_artist_idx` ON `tracks` (`artist_id`);--> statement-breakpoint
CREATE INDEX `tracks_album_idx` ON `tracks` (`album_id`);--> statement-breakpoint
CREATE INDEX `tracks_title_idx` ON `tracks` (`title`);--> statement-breakpoint
CREATE INDEX `tracks_favorite_idx` ON `tracks` (`is_favorite`);--> statement-breakpoint
CREATE INDEX `tracks_deleted_idx` ON `tracks` (`is_deleted`);--> statement-breakpoint
CREATE INDEX `tracks_play_count_idx` ON `tracks` (`play_count`);--> statement-breakpoint
CREATE INDEX `tracks_last_played_idx` ON `tracks` (`last_played_at`);