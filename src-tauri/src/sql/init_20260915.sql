ALTER TABLE `endpoint_config` RENAME TO `endpoint_config_old`;

CREATE TABLE `endpoint_config` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `createdDate` DATETIME NOT NULL,
  `updatedDate` DATETIME NOT NULL,
  --
  `isBuiltin` INTEGER DEFAULT 0,
  `name` VARCHAR(64),
  `baseUrl` VARCHAR(255),
  `apiKey` VARCHAR(255),
  `model` VARCHAR(64),
  `thinkingLevel` VARCHAR(16) DEFAULT 'none'
);

INSERT INTO
  `endpoint_config` (
    `id`,
    `createdDate`,
    `updatedDate`,
    `isBuiltin`,
    `name`,
    `baseUrl`,
    `apiKey`,
    `model`,
    `thinkingLevel`
  )
SELECT
  `id`,
  `createdDate`,
  `updatedDate`,
  `isBuiltin`,
  `name`,
  `baseUrl`,
  `apiKey`,
  `model`,
  CASE
    WHEN `reasoning` IN (1, '1', 'true', 'TRUE', 'True') THEN 'medium'
    ELSE 'none'
  END
FROM `endpoint_config_old`;

DROP TABLE `endpoint_config_old`;

CREATE UNIQUE INDEX `endpoint_config_index_id` ON `endpoint_config` (`id`);

ALTER TABLE `prompt_config` RENAME TO `prompt_config_old`;

CREATE TABLE `prompt_config` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `createdDate` DATETIME NOT NULL,
  `updatedDate` DATETIME NOT NULL,
  --
  `name` VARCHAR(64),
  `icon` VARCHAR(255),
  `prompt` text,
  `endpointId` INTEGER,
  `isBuiltin` INTEGER DEFAULT 0,
  `orderNo` INTEGER,
  `model` VARCHAR(64),
  `thinkingLevel` VARCHAR(16) DEFAULT 'none'
);

INSERT INTO
  `prompt_config` (
    `id`,
    `createdDate`,
    `updatedDate`,
    `name`,
    `icon`,
    `prompt`,
    `endpointId`,
    `isBuiltin`,
    `orderNo`,
    `model`,
    `thinkingLevel`
  )
SELECT
  `id`,
  `createdDate`,
  `updatedDate`,
  `name`,
  `icon`,
  `prompt`,
  `endpointId`,
  `isBuiltin`,
  `orderNo`,
  `model`,
  CASE
    WHEN `reasoning` IN (1, '1', 'true', 'TRUE', 'True') THEN 'medium'
    ELSE 'none'
  END
FROM `prompt_config_old`;

DROP TABLE `prompt_config_old`;

CREATE UNIQUE INDEX `prompt_config_index_id` ON `prompt_config` (`id`);
