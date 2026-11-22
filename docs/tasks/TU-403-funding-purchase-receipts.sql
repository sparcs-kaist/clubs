-- AlterTable
ALTER TABLE `funding` ADD COLUMN `purchase_quantity` INTEGER NULL,
    ADD COLUMN `receipt_id` INTEGER NULL,
    ADD COLUMN `receipt_item_number` INTEGER NULL;

-- CreateTable
CREATE TABLE `funding_receipt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `club_id` INTEGER NOT NULL,
    `expenditure_date` DATETIME(0) NOT NULL,
    `reference` VARCHAR(128) NOT NULL,
    `total_amount` INTEGER NOT NULL,
    `lock_version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `funding_receipt_club_id_expenditure_date_reference_key`(`club_id`, `expenditure_date`, `reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `funding_receipt_id_deleted_at_receipt_item_number_idx` ON `funding`(`receipt_id`, `deleted_at`, `receipt_item_number`);

-- AddForeignKey
ALTER TABLE `funding_receipt` ADD CONSTRAINT `funding_receipt_club_id_fkey` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funding` ADD CONSTRAINT `funding_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `funding_receipt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
