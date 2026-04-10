ALTER TABLE `api_keys`
  ADD COLUMN `credential_type` enum('api_key','oauth_token','entra_token') NOT NULL DEFAULT 'api_key',
  ADD COLUMN `base_url` varchar(512);
