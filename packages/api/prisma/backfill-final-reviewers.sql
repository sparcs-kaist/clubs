-- Run after applying schema.prisma so funding.commented_executive_id exists.
UPDATE activity AS a
INNER JOIN (
  SELECT feedback.activity_id, feedback.executive_id
  FROM activity_feedback AS feedback
  INNER JOIN (
    SELECT activity_id, MAX(id) AS id
    FROM activity_feedback
    WHERE deleted_at IS NULL
    GROUP BY activity_id
  ) AS latest ON latest.id = feedback.id
) AS final_review ON final_review.activity_id = a.id
SET a.commented_executive_id = final_review.executive_id
WHERE a.deleted_at IS NULL;

UPDATE funding AS f
INNER JOIN (
  SELECT feedback.funding_id, feedback.executive_id
  FROM funding_feedback AS feedback
  INNER JOIN (
    SELECT funding_id, MAX(id) AS id
    FROM funding_feedback
    WHERE deleted_at IS NULL
    GROUP BY funding_id
  ) AS latest ON latest.id = feedback.id
) AS final_review ON final_review.funding_id = f.id
SET f.commented_executive_id = final_review.executive_id
WHERE f.deleted_at IS NULL;
