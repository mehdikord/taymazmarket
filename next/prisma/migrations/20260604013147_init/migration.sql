-- CreateTable
CREATE TABLE `countries` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` CHAR(2) NOT NULL,
    `name_fa` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `phone_prefix` VARCHAR(5) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `countries_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_mobile_key`(`mobile`),
    INDEX `admins_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,
    `telegram_chat_id` BIGINT UNSIGNED NULL,
    `telegram_username` VARCHAR(64) NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `profile_image_url` VARCHAR(500) NULL,
    `verification_code` VARCHAR(64) NULL,
    `notes` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_telegram_chat_id_key`(`telegram_chat_id`),
    UNIQUE INDEX `users_mobile_key`(`mobile`),
    INDEX `users_verification_code_idx`(`verification_code`),
    INDEX `users_deleted_at_idx`(`deleted_at`),
    INDEX `users_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencies` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `country_id` BIGINT UNSIGNED NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `currencies_slug_key`(`slug`),
    INDEX `currencies_country_id_idx`(`country_id`),
    INDEX `currencies_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_bank_accounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `currency_id` BIGINT UNSIGNED NOT NULL,
    `account_number` VARCHAR(64) NOT NULL,
    `label` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_bank_accounts_user_id_currency_id_idx`(`user_id`, `currency_id`),
    UNIQUE INDEX `user_bank_accounts_user_id_currency_id_account_number_key`(`user_id`, `currency_id`, `account_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tracking_code` VARCHAR(8) NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `source_currency_id` BIGINT UNSIGNED NOT NULL,
    `target_currency_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(20, 4) NOT NULL,
    `bank_account` VARCHAR(64) NOT NULL,
    `invoice_image_url` VARCHAR(500) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `rejection_reason` TEXT NULL,
    `reviewed_by_id` BIGINT UNSIGNED NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exchange_requests_tracking_code_key`(`tracking_code`),
    INDEX `exchange_requests_user_id_idx`(`user_id`),
    INDEX `exchange_requests_status_idx`(`status`),
    INDEX `exchange_requests_status_created_at_idx`(`status`, `created_at`),
    INDEX `exchange_requests_source_currency_id_idx`(`source_currency_id`),
    INDEX `exchange_requests_target_currency_id_idx`(`target_currency_id`),
    INDEX `exchange_requests_reviewed_by_id_idx`(`reviewed_by_id`),
    INDEX `exchange_requests_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `actor_type` ENUM('admin', 'user', 'system') NOT NULL,
    `actor_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `system_logs_actor_type_actor_id_idx`(`actor_type`, `actor_id`),
    INDEX `system_logs_action_idx`(`action`),
    INDEX `system_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `system_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `currencies` ADD CONSTRAINT `currencies_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bank_accounts` ADD CONSTRAINT `user_bank_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bank_accounts` ADD CONSTRAINT `user_bank_accounts_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_requests` ADD CONSTRAINT `exchange_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_requests` ADD CONSTRAINT `exchange_requests_source_currency_id_fkey` FOREIGN KEY (`source_currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_requests` ADD CONSTRAINT `exchange_requests_target_currency_id_fkey` FOREIGN KEY (`target_currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_requests` ADD CONSTRAINT `exchange_requests_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
