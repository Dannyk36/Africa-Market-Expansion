CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`provider` enum('openrouter','openai','anthropic','cohere','custom') NOT NULL,
	`name` varchar(255) NOT NULL,
	`encrypted_key` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_used` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`website` varchar(255),
	`industry` varchar(255),
	`business_model` varchar(255),
	`target_markets` json,
	`current_presence` json,
	`revenue` decimal(15,2),
	`employees` int,
	`funding_stage` varchar(255),
	`key_capabilities` json,
	`analysis_date` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`query_id` int,
	`rating` int NOT NULL,
	`comment` text,
	`recommendation_accuracy` enum('very_poor','poor','neutral','good','excellent'),
	`action_taken` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_outcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`query_id` int,
	`country` varchar(255) NOT NULL,
	`investment_amount` decimal(15,2),
	`investment_date` timestamp,
	`expected_return` decimal(5,2),
	`actual_return` decimal(5,2),
	`outcome` enum('success','partial_success','neutral','failure'),
	`notes` text,
	`reported_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investment_outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`company_profile_id` int,
	`country` varchar(255) NOT NULL,
	`recommendation_score` decimal(5,2) NOT NULL,
	`reasoning` text NOT NULL,
	`risk_level` enum('very_low','low','medium','high','very_high') NOT NULL,
	`entry_strategy` text,
	`potential_revenue` decimal(15,2),
	`timeline_months` int,
	`user_feedback` enum('positive','neutral','negative'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`provider` enum('openrouter','openai','anthropic','cohere','custom') NOT NULL,
	`model` varchar(255) NOT NULL,
	`query` text NOT NULL,
	`response` text NOT NULL,
	`tokens_used` int,
	`cost_usd` decimal(8,6),
	`query_type` enum('market_analysis','company_profile','recommendation','general') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `query_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scoring_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country` varchar(255) NOT NULL,
	`original_score` decimal(5,2) NOT NULL,
	`adjusted_score` decimal(5,2) NOT NULL,
	`adjustment_reason` varchar(255) NOT NULL,
	`data_points` int NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scoring_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`provider` enum('openrouter','openai','anthropic','cohere','custom') NOT NULL,
	`queries_count` int DEFAULT 0,
	`tokens_used` int DEFAULT 0,
	`cost_usd` decimal(8,6) DEFAULT '0',
	CONSTRAINT `usage_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`preferred_provider` enum('openrouter','openai','anthropic','cohere','custom'),
	`preferred_model` varchar(255),
	`default_temperature` decimal(3,2) DEFAULT '0.7',
	`default_max_tokens` int DEFAULT 2000,
	`usage_quota_monthly` int DEFAULT 10000,
	`enable_feedback` boolean DEFAULT true,
	`enable_outcome_tracking` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_profiles` ADD CONSTRAINT `company_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_query_id_query_history_id_fk` FOREIGN KEY (`query_id`) REFERENCES `query_history`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_outcomes` ADD CONSTRAINT `investment_outcomes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investment_outcomes` ADD CONSTRAINT `investment_outcomes_query_id_query_history_id_fk` FOREIGN KEY (`query_id`) REFERENCES `query_history`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `market_recommendations` ADD CONSTRAINT `market_recommendations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `market_recommendations` ADD CONSTRAINT `market_recommendations_company_profile_id_company_profiles_id_fk` FOREIGN KEY (`company_profile_id`) REFERENCES `company_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `query_history` ADD CONSTRAINT `query_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_analytics` ADD CONSTRAINT `usage_analytics_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;