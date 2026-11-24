-- TU-519: create the activity and funding review history and memo tables.
-- CreateTable
CREATE TABLE `activity_internal_memo` (
    `activity_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `updated_by` VARCHAR(255) NOT NULL,
    `updated_by_executive_id` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_change_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `editor_student_id` INTEGER NOT NULL,
    `before` JSON NOT NULL,
    `after` JSON NOT NULL,
    `created_at` TIMESTAMP(3) NOT NULL,

    INDEX `activity_change_history_activity_id_id_idx`(`activity_id`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funding_internal_memo` (
    `funding_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `updated_by` VARCHAR(255) NOT NULL,
    `updated_by_executive_id` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`funding_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funding_change_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funding_id` INTEGER NOT NULL,
    `editor_student_id` INTEGER NOT NULL,
    `before` JSON NOT NULL,
    `after` JSON NOT NULL,
    `created_at` TIMESTAMP(3) NOT NULL,

    INDEX `funding_change_history_funding_id_id_idx`(`funding_id`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activity_internal_memo` ADD CONSTRAINT `activity_internal_memo_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_change_history` ADD CONSTRAINT `activity_change_history_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funding_internal_memo` ADD CONSTRAINT `funding_internal_memo_funding_id_fkey` FOREIGN KEY (`funding_id`) REFERENCES `funding`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funding_change_history` ADD CONSTRAINT `funding_change_history_funding_id_fkey` FOREIGN KEY (`funding_id`) REFERENCES `funding`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
