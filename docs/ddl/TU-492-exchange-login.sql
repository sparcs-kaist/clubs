-- TU-492: run on the selected dev/production database before API deployment.
-- Existing tables and foreign keys are unchanged.
CREATE TABLE `auth_exchange_login_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_user_id` INTEGER NOT NULL,
    `actor_email` VARCHAR(255) NULL,
    `target_user_id` INTEGER NOT NULL,
    `target_email` VARCHAR(255) NULL,
    `original_actor_user_id` INTEGER NOT NULL,
    `original_actor_email` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `auth_exchange_login_log_original_actor_user_id_created_at_idx` (`original_actor_user_id`, `created_at`),
    INDEX `auth_exchange_login_log_target_user_id_created_at_idx` (`target_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
