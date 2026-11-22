-- 새 API 배포가 끝나고 이전 버전의 등록 쓰기 요청이 모두 종료된 뒤 실행합니다.
-- 기존 서명 시각을 기준으로 상태만 채웁니다. 새 API가 기록한 유효한 상태와 이력은 보존합니다.
UPDATE `registration`
SET `professor_approval_status` = CASE
  WHEN `professor_approved_at` IS NULL THEN 'PENDING'
  ELSE 'APPROVED'
END
WHERE `professor_approval_status` IS NULL
   OR (`professor_approved_at` IS NULL AND `professor_approval_status` <> 'PENDING')
   OR (`professor_approved_at` IS NOT NULL AND `professor_approval_status` = 'PENDING');

-- 이관 후 세 집계가 모두 0인지 확인합니다.
SELECT
  COUNT(CASE WHEN `professor_approval_status` IS NULL THEN 1 END) AS `missing_status`,
  COUNT(CASE WHEN `professor_approved_at` IS NULL AND `professor_approval_status` <> 'PENDING' THEN 1 END) AS `unsigned_with_approval`,
  COUNT(CASE WHEN `professor_approved_at` IS NOT NULL AND `professor_approval_status` = 'PENDING' THEN 1 END) AS `signed_with_pending_status`
FROM `registration`;
