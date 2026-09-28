-- Select the target database with USE and deploy the enum-independent API first.
-- MySQL DDL commits implicitly. Back up these dictionary tables before running.
-- Only the 20 listed tables and their inbound FKs in this database are removed.
-- Business columns, values, indexes and unrelated FKs remain unchanged.
DROP PROCEDURE IF EXISTS tu507_drop_enum_tables;

DELIMITER $$
CREATE PROCEDURE tu507_drop_enum_tables()
BEGIN
  DECLARE finished BOOLEAN DEFAULT FALSE;
  DECLARE source_table VARCHAR(64);
  DECLARE foreign_key_name VARCHAR(64);
  DECLARE enum_foreign_keys CURSOR FOR
    SELECT DISTINCT TABLE_NAME, CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME IN (
        'activity_certificate_status_enum',
        'activity_status_enum',
        'activity_type_enum',
        'club_building_enum',
        'club_delegate_change_request_status_enum',
        'club_delegate_enum',
        'club_status_enum',
        'common_space_enum',
        'executive_bureau_enum',
        'executive_status_enum',
        'meeting_role_enum',
        'professor_enum',
        'promotional_printing_order_status_enum',
        'promotional_printing_size_enum',
        'registration_application_student_status_enum',
        'registration_status_enum',
        'registration_type_enum',
        'rental_enum',
        'student_enum',
        'student_status_enum'
      );
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = TRUE;

  OPEN enum_foreign_keys;
  remove_foreign_keys: LOOP
    FETCH enum_foreign_keys INTO source_table, foreign_key_name;
    IF finished THEN
      LEAVE remove_foreign_keys;
    END IF;
    SET @tu507_drop_fk = CONCAT(
      'ALTER TABLE `', REPLACE(source_table, '`', '``'),
      '` DROP FOREIGN KEY `', REPLACE(foreign_key_name, '`', '``'), '`'
    );
    PREPARE tu507_drop_fk FROM @tu507_drop_fk;
    EXECUTE tu507_drop_fk;
    DEALLOCATE PREPARE tu507_drop_fk;
  END LOOP;
  CLOSE enum_foreign_keys;

  DROP TABLE IF EXISTS
    activity_certificate_status_enum,
    activity_status_enum,
    activity_type_enum,
    club_building_enum,
    club_delegate_change_request_status_enum,
    club_delegate_enum,
    club_status_enum,
    common_space_enum,
    executive_bureau_enum,
    executive_status_enum,
    meeting_role_enum,
    professor_enum,
    promotional_printing_order_status_enum,
    promotional_printing_size_enum,
    registration_application_student_status_enum,
    registration_status_enum,
    registration_type_enum,
    rental_enum,
    student_enum,
    student_status_enum;
END$$
DELIMITER ;

CALL tu507_drop_enum_tables();
DROP PROCEDURE tu507_drop_enum_tables;
