export const ActivityTypeEnum = {
  matchedInternalActivity: 1,
  matchedExternalActivity: 2,
  notMatchedActivity: 3,
} as const;

export type ActivityTypeEnum =
  (typeof ActivityTypeEnum)[keyof typeof ActivityTypeEnum];

export const ActivityStatusEnum = {
  Applied: 1, // 신청
  Approved: 2, // 승인
  Rejected: 3, // 반려
  Committee: 4, // 운영위원회
} as const;

export type ActivityStatusEnum =
  (typeof ActivityStatusEnum)[keyof typeof ActivityStatusEnum];

// 활동보고서 기간 종류 - @clubs/domain에서 가져옴
export { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

export const ActivityDurationTypeEnum = {
  Regular: 1, // 정규 활동 보고서
  Registration: 2, // 신규등록용 활동보고서
} as const;

export type ActivityDurationTypeEnum =
  (typeof ActivityDurationTypeEnum)[keyof typeof ActivityDurationTypeEnum];
