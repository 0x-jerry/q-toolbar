ALTER TABLE `chat_history_msg` ADD COLUMN `reasoning` TEXT NOT NULL DEFAULT "";
ALTER TABLE `endpoint_config` ADD COLUMN `reasoning` BOOLEAN;

ALTER TABLE `prompt_config` ADD COLUMN `reasoning` BOOLEAN;
ALTER TABLE `prompt_config` ADD COLUMN `model` VARCHAR(64);
