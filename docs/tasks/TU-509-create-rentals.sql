-- CreateTable
CREATE TABLE `office_hour` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `opens_at` DATETIME(0) NOT NULL,
    `closes_at` DATETIME(0) NOT NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `public_memo` VARCHAR(500) NULL,
    `internal_memo` VARCHAR(500) NULL,
    `updated_by_executive_id` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `office_hour_date_updated_at_id_idx`(`date`, `updated_at`, `id`),
    INDEX `office_hour_closes_at_idx`(`closes_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `total_quantity` INTEGER UNSIGNED NOT NULL,
    `duration_type` VARCHAR(30) NOT NULL,
    `duration_value` INTEGER UNSIGNED NOT NULL,
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
    `duration_type` VARCHAR(30) NOT NULL,
    `duration_value` INTEGER UNSIGNED NOT NULL,
    `regular_return_limit_date` DATE NOT NULL,
    `approved_extension_id` INTEGER NULL,
    `pickup_hour_id` INTEGER NOT NULL,
    `return_hour_id` INTEGER NOT NULL,
    `client_request_id` CHAR(36) NOT NULL,
    `request_fingerprint` CHAR(64) NOT NULL,
    `approved_at` DATETIME(3) NULL,
    `approved_by_executive_id` INTEGER NULL,
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

    INDEX `rental_reservation_item_id_status_pickup_hour_id_idx`(`item_id`, `status`, `pickup_hour_id`),
    INDEX `rental_reservation_student_id_created_at_idx`(`student_id`, `created_at`),
    INDEX `rental_reservation_pickup_hour_id_idx`(`pickup_hour_id`),
    INDEX `rental_reservation_return_hour_id_idx`(`return_hour_id`),
    INDEX `rental_reservation_id_approved_extension_id_idx`(`id`, `approved_extension_id`),
    UNIQUE INDEX `rental_reservation_student_id_client_request_id_key`(`student_id`, `client_request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_extension` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservation_id` INTEGER NOT NULL,
    `previous_return_hour_id` INTEGER NOT NULL,
    `new_return_hour_id` INTEGER NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `processed_by_executive_id` INTEGER NOT NULL,
    `processed_at` DATETIME(3) NOT NULL,

    INDEX `rental_extension_reservation_id_processed_at_idx`(`reservation_id`, `processed_at`),
    UNIQUE INDEX `rental_extension_reservation_id_id_key`(`reservation_id`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
