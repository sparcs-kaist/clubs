-- Run after selecting the target database with USE.
-- Remove only student_t.student_enum -> student_enum foreign keys, if present.
-- Keep the student_id foreign key, columns, indexes, tables and existing data.
SET @drop_student_enum_fk_sql = (
  SELECT CONCAT(
    'ALTER TABLE `student_t` ',
    GROUP_CONCAT(DISTINCT CONCAT(
      'DROP FOREIGN KEY `', REPLACE(CONSTRAINT_NAME, '`', '``'), '`'
    ) SEPARATOR ', ')
  )
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'student_t'
    AND COLUMN_NAME = 'student_enum'
    AND REFERENCED_TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME = 'student_enum'
);

SET @drop_student_enum_fk_sql = COALESCE(@drop_student_enum_fk_sql, 'DO 0');
PREPARE drop_student_enum_fk FROM @drop_student_enum_fk_sql;
EXECUTE drop_student_enum_fk;
DEALLOCATE PREPARE drop_student_enum_fk;
