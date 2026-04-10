CREATE TABLE `source_configs` (
	`source_id` varchar(128) NOT NULL,
	`source_name` varchar(255) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`interval_hours` int NOT NULL DEFAULT 24,
	`last_run_at` timestamp,
	`next_run_at` timestamp,
	`last_status` enum('idle','success','failed') NOT NULL DEFAULT 'idle',
	`last_message` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `source_configs_source_id` PRIMARY KEY(`source_id`)
);
