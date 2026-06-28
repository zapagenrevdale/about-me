CREATE TABLE `diary_entries` (
	`period_key` text PRIMARY KEY NOT NULL,
	`period_type` text NOT NULL,
	`period_start` text NOT NULL,
	`content_json` text NOT NULL,
	`plain_text` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
