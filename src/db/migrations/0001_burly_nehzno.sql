DROP TABLE `favorites`;--> statement-breakpoint
ALTER TABLE `albums` ADD `is_favorite` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `albums` ADD `favorited_at` integer;--> statement-breakpoint
CREATE INDEX `albums_is_favorite_idx` ON `albums` (`is_favorite`);--> statement-breakpoint
ALTER TABLE `artists` ADD `is_favorite` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `artists` ADD `favorited_at` integer;--> statement-breakpoint
CREATE INDEX `artists_is_favorite_idx` ON `artists` (`is_favorite`);--> statement-breakpoint
ALTER TABLE `playlists` ADD `favorited_at` integer;--> statement-breakpoint
ALTER TABLE `tracks` ADD `favorited_at` integer;