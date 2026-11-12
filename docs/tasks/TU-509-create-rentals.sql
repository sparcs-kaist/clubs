-- CreateTable
CREATE TABLE `office_hour` (
    `date` CHAR(10) NOT NULL,
    `opens_at` DATETIME(0) NOT NULL,
    `closes_at` DATETIME(0) NOT NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `version` INTEGER NOT NULL DEFAULT 1,
    `updated_by_executive_id` INTEGER NULL,
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`date`, `version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `total_quantity` INTEGER UNSIGNED NOT NULL,
    `duration_policy` VARCHAR(30) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `lock_version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_reservation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NOT NULL,
    `club_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `contact_phone_number` VARCHAR(30) NOT NULL,
    `purpose` VARCHAR(500) NOT NULL,
    `quantity` INTEGER UNSIGNED NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `duration_policy` VARCHAR(30) NOT NULL,
    `regular_return_limit_date` CHAR(10) NOT NULL,
    `approved_extension_id` INTEGER NULL,
    `pickup_date` CHAR(10) NOT NULL,
    `pickup_version` INTEGER NOT NULL,
    `return_date` CHAR(10) NOT NULL,
    `return_version` INTEGER NOT NULL,
    `client_request_id` CHAR(36) NOT NULL,
    `request_fingerprint` CHAR(64) NOT NULL,
    `checked_out_at` DATETIME(3) NULL,
    `checked_out_by_executive_id` INTEGER NULL,
    `checkout_memo` VARCHAR(500) NULL,
    `returned_at` DATETIME(3) NULL,
    `returned_by_executive_id` INTEGER NULL,
    `closed_at` DATETIME(3) NULL,
    `closed_by_user_id` INTEGER NULL,
    `close_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rental_reservation_item_id_status_pickup_date_idx`(`item_id`, `status`, `pickup_date`),
    INDEX `rental_reservation_student_id_created_at_idx`(`student_id`, `created_at`),
    INDEX `rental_reservation_pickup_date_pickup_version_idx`(`pickup_date`, `pickup_version`),
    INDEX `rental_reservation_return_date_return_version_idx`(`return_date`, `return_version`),
    INDEX `rental_reservation_id_approved_extension_id_idx`(`id`, `approved_extension_id`),
    UNIQUE INDEX `rental_reservation_student_id_client_request_id_key`(`student_id`, `client_request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_extension` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservation_id` INTEGER NOT NULL,
    `previous_return_date` CHAR(10) NOT NULL,
    `previous_return_version` INTEGER NOT NULL,
    `new_return_date` CHAR(10) NOT NULL,
    `new_return_version` INTEGER NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `processed_by_executive_id` INTEGER NOT NULL,
    `processed_at` DATETIME(3) NOT NULL,

    INDEX `rental_extension_reservation_id_processed_at_idx`(`reservation_id`, `processed_at`),
    UNIQUE INDEX `rental_extension_reservation_id_id_key`(`reservation_id`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `office_hour` ADD CONSTRAINT `office_hour_updated_by_executive_id_fkey` FOREIGN KEY (`updated_by_executive_id`) REFERENCES `executive`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `rental_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_club_id_fkey` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_checked_out_by_executive_id_fkey` FOREIGN KEY (`checked_out_by_executive_id`) REFERENCES `executive`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_returned_by_executive_id_fkey` FOREIGN KEY (`returned_by_executive_id`) REFERENCES `executive`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_closed_by_user_id_fkey` FOREIGN KEY (`closed_by_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_pickup_date_pickup_version_fkey` FOREIGN KEY (`pickup_date`, `pickup_version`) REFERENCES `office_hour`(`date`, `version`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_return_date_return_version_fkey` FOREIGN KEY (`return_date`, `return_version`) REFERENCES `office_hour`(`date`, `version`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rental_reservation` ADD CONSTRAINT `rental_reservation_id_approved_extension_id_fkey` FOREIGN KEY (`id`, `approved_extension_id`) REFERENCES `rental_extension`(`reservation_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rental_extension` ADD CONSTRAINT `rental_extension_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `rental_reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_extension` ADD CONSTRAINT `rental_extension_previous_return_date_previous_return_versi_fkey` FOREIGN KEY (`previous_return_date`, `previous_return_version`) REFERENCES `office_hour`(`date`, `version`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rental_extension` ADD CONSTRAINT `rental_extension_new_return_date_new_return_version_fkey` FOREIGN KEY (`new_return_date`, `new_return_version`) REFERENCES `office_hour`(`date`, `version`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rental_extension` ADD CONSTRAINT `rental_extension_processed_by_executive_id_fkey` FOREIGN KEY (`processed_by_executive_id`) REFERENCES `executive`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
