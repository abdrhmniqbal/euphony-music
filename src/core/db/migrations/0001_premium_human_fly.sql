PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_artists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_name` text,
	`artwork` text,
	`bio` text,
	`deezer_id` integer,
	`track_count` integer DEFAULT 0,
	`album_count` integer DEFAULT 0,
	`is_favorite` integer DEFAULT 0,
	`favorited_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_artists`("id", "name", "sort_name", "artwork", "bio", "deezer_id", "track_count", "album_count", "is_favorite", "favorited_at", "created_at", "updated_at") SELECT "id", "name", "sort_name", "artwork", "bio", "deezer_id", "track_count", "album_count", "is_favorite", "favorited_at", "created_at", "updated_at" FROM `artists`;--> statement-breakpoint
DROP TABLE `artists`;--> statement-breakpoint
ALTER TABLE `__new_artists` RENAME TO `artists`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `artists_name_idx` ON `artists` (`name`);--> statement-breakpoint
CREATE INDEX `artists_sort_name_idx` ON `artists` (`sort_name`);--> statement-breakpoint
CREATE INDEX `artists_is_favorite_idx` ON `artists` (`is_favorite`);