-- Apply once before deploying TU-499. A duplicate id intentionally fails:
-- inspect existing rows instead of overwriting another degree.
-- Internal IDs differ from the SSO program codes; preserve IDs 1, 2 and 3.
INSERT INTO student_enum (id, name)
VALUES
  (4, '석박통합생(박사)'),
  (5, '석박통합생(석사)'),
  (6, '과정전체'),
  (7, '청강생');

SELECT id, name, deleted_at
FROM student_enum
ORDER BY id;
