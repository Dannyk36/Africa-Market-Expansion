CREATE TABLE `source_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_name` varchar(255) NOT NULL,
	`source_type` enum('official_release','dataset','policy_update','trade_update','news_brief') NOT NULL,
	`source_url` varchar(1024) NOT NULL,
	`title` varchar(512) NOT NULL,
	`region_scope` varchar(255),
	`country_codes` json,
	`published_at` timestamp,
	`retrieved_at` timestamp NOT NULL DEFAULT (now()),
	`trust_score` decimal(4,2) NOT NULL DEFAULT '1.00',
	`raw_text` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `source_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_document_id` int,
	`country` varchar(255) NOT NULL,
	`event_type` enum('treaty','trade_deal','policy_change','geopolitics','market_signal','infrastructure','regulatory','macro') NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`impact_direction` enum('positive','neutral','negative','mixed') NOT NULL DEFAULT 'mixed',
	`impact_score` decimal(4,2) NOT NULL DEFAULT '0.00',
	`confidence` decimal(4,2) NOT NULL DEFAULT '0.50',
	`effective_date` timestamp,
	`expires_at` timestamp,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insight_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `insight_events` ADD CONSTRAINT `insight_events_source_document_id_source_documents_id_fk` FOREIGN KEY (`source_document_id`) REFERENCES `source_documents`(`id`) ON DELETE set null ON UPDATE no action;
