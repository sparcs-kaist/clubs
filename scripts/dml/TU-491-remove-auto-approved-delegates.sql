-- TU-491: remove mistakenly auto-created delegate memberships after club approval.
-- MySQL 8. Run the entire file in ONE session; the default ending is ROLLBACK.
-- 1. Set the explicit semester ID below and run once to inspect candidates.
-- 2. Fill the reviewed ID allowlist after checking each student's application.
-- 3. Rerun, inspect affected rows, and replace only the final ROLLBACK with COMMIT.
-- No creation-source/audit column exists. Matching approval timestamps are a
-- candidate heuristic, NOT proof. Existing applications forcibly approved by the
-- old code cannot be restored automatically because their old status is unknown.
-- Only newly created application/member pairs can be deleted here. Other members,
-- the registration applicant, historical terms, and other semesters are preserved.
-- An applicant who is not the current representative needs separate review.

SET SESSION time_zone = '+09:00';
SET @semester_id = NULL; -- Required: semester_d.id, never inferred from NOW().
SET @cleanup_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tu491_reviewed;
CREATE TEMPORARY TABLE tu491_reviewed (
  registration_id INT NOT NULL,
  student_id INT NOT NULL,
  application_id INT NOT NULL,
  member_id INT NOT NULL,
  PRIMARY KEY (registration_id, student_id, application_id, member_id)
);

-- Paste reviewed IDs from the candidate preview; an empty allowlist changes nothing.
-- INSERT INTO tu491_reviewed VALUES (registration_id, student_id, application_id, member_id);

START TRANSACTION;

-- Lock the selected approved registrations and records before calculating targets.
SELECT r.id
FROM registration r
JOIN tu491_reviewed a ON a.registration_id = r.id
WHERE r.semester_d_id = @semester_id AND r.deleted_at IS NULL
FOR UPDATE;
SELECT m.id
FROM club_student_t m
JOIN tu491_reviewed a ON a.member_id = m.id
FOR UPDATE;
SELECT a.id
FROM registration_application_student a
JOIN tu491_reviewed picked ON picked.application_id = a.id
FOR UPDATE;
SELECT d.id
FROM club_delegate_d d
JOIN registration r ON r.club_id = d.club_id
JOIN tu491_reviewed picked ON picked.registration_id = r.id
WHERE r.semester_d_id = @semester_id AND d.deleted_at IS NULL
FOR UPDATE;

DROP TEMPORARY TABLE IF EXISTS tu491_candidates;
CREATE TEMPORARY TABLE tu491_candidates AS
SELECT DISTINCT
  r.id AS registration_id,
  r.club_id,
  r.student_id AS applicant_student_id,
  r.reviewed_at,
  member.student_id,
  student.name AS student_name,
  student.number AS student_number,
  application.id AS application_id,
  application.created_at AS application_created_at,
  member.id AS member_id,
  member.created_at AS member_created_at,
  DATE_SUB(previous.end_term, INTERVAL 1 DAY) AS effective_at,
  (
    application.registration_application_student_status_enum = 2
    AND application.created_at BETWEEN r.reviewed_at AND DATE_ADD(r.reviewed_at, INTERVAL 30 SECOND)
    AND member.created_at BETWEEN r.reviewed_at AND DATE_ADD(r.reviewed_at, INTERVAL 30 SECOND)
    AND member.start_term = club_term.start_term
    AND member.end_term = COALESCE(club_term.end_term, semester.end_term)
  ) AS matches_auto_created_pair,
  EXISTS (
    SELECT 1 FROM club_delegate_d representative
    WHERE representative.club_id = r.club_id
      AND representative.student_id = r.student_id
      AND representative.club_delegate_enum_id = 1
      AND representative.start_term <= @cleanup_at
      AND (representative.end_term IS NULL OR representative.end_term > @cleanup_at)
      AND representative.deleted_at IS NULL
  ) AS applicant_is_current_representative
FROM registration r
JOIN semester_d semester ON semester.id = r.semester_d_id AND semester.deleted_at IS NULL
JOIN semester_d previous ON previous.id = semester.id - 1 AND previous.deleted_at IS NULL
JOIN club_t club_term ON club_term.club_id = r.club_id
  AND club_term.semester_id = r.semester_d_id AND club_term.deleted_at IS NULL
JOIN club_student_t member ON member.club_id = r.club_id
  AND member.semester_id = r.semester_d_id AND member.deleted_at IS NULL
JOIN registration_application_student application ON application.club_id = r.club_id
  AND application.semester_d_id = r.semester_d_id
  AND application.student_id = member.student_id AND application.deleted_at IS NULL
JOIN student ON student.id = member.student_id
WHERE r.semester_d_id = @semester_id
  AND r.registration_application_status_enum_id = 2
  AND r.deleted_at IS NULL
  AND member.student_id <> r.student_id
  -- Include former delegates already ended retroactively by the executive page.
  AND EXISTS (
    SELECT 1 FROM club_delegate_d d
    WHERE d.club_id = r.club_id AND d.student_id = member.student_id
      AND d.club_delegate_enum_id IN (2, 3)
      AND d.created_at <= r.reviewed_at AND d.start_term <= r.reviewed_at
      AND (d.end_term IS NULL OR d.end_term >= previous.start_term)
      AND d.deleted_at IS NULL
  );

-- Full preview includes excluded rows: inspect both flags before selecting IDs.
SELECT * FROM tu491_candidates ORDER BY club_id, student_id;

DROP TEMPORARY TABLE IF EXISTS tu491_targets;
CREATE TEMPORARY TABLE tu491_targets AS
SELECT candidate.*
FROM tu491_candidates candidate
JOIN tu491_reviewed picked USING (registration_id, student_id, application_id, member_id)
WHERE candidate.matches_auto_created_pair = 1
  AND candidate.applicant_is_current_representative = 1;

SELECT * FROM tu491_targets ORDER BY club_id, student_id;

UPDATE registration_application_student application
JOIN tu491_targets target ON target.application_id = application.id
SET application.deleted_at = @cleanup_at
WHERE application.student_id = target.student_id
  AND application.student_id <> target.applicant_student_id
  AND application.club_id = target.club_id
  AND application.semester_d_id = @semester_id
  AND application.deleted_at IS NULL;
SELECT ROW_COUNT() AS deleted_member_applications;

UPDATE club_student_t member
JOIN tu491_targets target ON target.member_id = member.id
SET member.deleted_at = @cleanup_at
WHERE member.student_id = target.student_id
  AND member.student_id <> target.applicant_student_id
  AND member.club_id = target.club_id
  AND member.semester_id = @semester_id
  AND member.deleted_at IS NULL;
SELECT ROW_COUNT() AS deleted_memberships;

-- Keep the old role rows; only end still-open prior terms at the page's cutoff.
UPDATE club_delegate_d delegate
JOIN tu491_targets target ON target.club_id = delegate.club_id
  AND target.student_id = delegate.student_id
SET delegate.end_term = target.effective_at
WHERE delegate.student_id <> target.applicant_student_id
  AND delegate.club_delegate_enum_id IN (2, 3)
  AND delegate.start_term <= target.effective_at
  AND delegate.created_at <= target.reviewed_at
  AND (delegate.end_term IS NULL OR delegate.end_term > target.effective_at)
  AND delegate.deleted_at IS NULL;
SELECT ROW_COUNT() AS ended_delegate_terms;

ROLLBACK;
