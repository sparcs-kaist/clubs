-- 새 API 배포 전에 실행합니다.
ALTER TABLE `registration`
  ADD COLUMN `professor_approval_status` ENUM('PENDING', 'APPROVED', 'LATE_APPROVED')
  NOT NULL DEFAULT 'PENDING';

CREATE TABLE `registration_professor_approval_log` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `registration_id` INTEGER NOT NULL,
  `professor_id` INTEGER NOT NULL,
  `approved_at` TIMESTAMP(0) NOT NULL,
  `approval_status` ENUM('PENDING', 'APPROVED', 'LATE_APPROVED') NOT NULL,
  INDEX `idx_registration_professor_approval_log_registration_time` (`registration_id`, `approved_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
