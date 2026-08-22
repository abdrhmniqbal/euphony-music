CREATE TABLE `mix_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`mix_id` text NOT NULL,
	`track_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`mix_id`) REFERENCES `mixes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mix_tracks_mix_idx` ON `mix_tracks` (`mix_id`);--> statement-breakpoint
CREATE INDEX `mix_tracks_track_idx` ON `mix_tracks` (`track_id`);--> statement-breakpoint
CREATE INDEX `mix_tracks_position_idx` ON `mix_tracks` (`mix_id`,`position`);--> statement-breakpoint
CREATE TABLE `mixes` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`timespan` text,
	`generated_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
