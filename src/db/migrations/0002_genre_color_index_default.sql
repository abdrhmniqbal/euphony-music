PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_genres` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '0' NOT NULL,
	`shape` text DEFAULT 'circles' NOT NULL,
	`track_count` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_genres`("id", "name", "color", "shape", "track_count", "created_at") SELECT "id", "name", CASE "color" WHEN 'bg-rainbow-lime' THEN '0' WHEN 'bg-rainbow-teal' THEN '1' WHEN 'bg-rainbow-cyan' THEN '2' WHEN 'bg-rainbow-blue' THEN '3' WHEN 'bg-rainbow-indigo' THEN '4' WHEN 'bg-rainbow-purple' THEN '5' WHEN 'bg-rainbow-magenta' THEN '6' WHEN 'bg-rainbow-red' THEN '7' WHEN 'bg-rainbow-orange' THEN '8' WHEN 'bg-rainbow-amber' THEN '9' ELSE COALESCE("color", '0') END, "shape", "track_count", "created_at" FROM `genres`;--> statement-breakpoint
DROP TABLE `genres`;--> statement-breakpoint
ALTER TABLE `__new_genres` RENAME TO `genres`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `genres_name_unique` ON `genres` (`name`);--> statement-breakpoint
CREATE INDEX `genres_name_idx` ON `genres` (`name`);