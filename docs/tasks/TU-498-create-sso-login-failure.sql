-- TU-498: apply only this new table; retain all existing foreign keys.
CREATE TABLE `auth_sso_login_failure_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `occurred_at` DATETIME(3) NOT NULL,
    `trace_id` VARCHAR(36) NOT NULL,
    `stage` VARCHAR(64) NOT NULL,
    `http_status` INTEGER NOT NULL,
    `error_name` VARCHAR(128) NOT NULL,
    `error_message` TEXT NOT NULL,
    `error_stack` TEXT NULL,
    `method` VARCHAR(16) NOT NULL,
    `path` VARCHAR(128) NOT NULL,
    `user_id` INTEGER NULL,
    `student_id` INTEGER NULL,
    `diagnostics` JSON NOT NULL,

    UNIQUE INDEX `auth_sso_login_failure_log_trace_id_key`(`trace_id`),
    INDEX `auth_sso_login_failure_log_occurred_at_idx`(`occurred_at`),
    INDEX `auth_sso_login_failure_log_user_id_occurred_at_idx`(`user_id`, `occurred_at`),
    INDEX `auth_sso_login_failure_log_student_id_occurred_at_idx`(`student_id`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
