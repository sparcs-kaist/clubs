export enum ActivityTypeEnum {
  matchedInternalActivity = 1,
  matchedExternalActivity,
  notMatchedActivity,
}

export enum ActivityStatusEnum {
  Applied = 1, // 신청
  Approved, // 승인
  Rejected, // 반려
  Committee, // 운영위원회
}

// 활동보고서 기간 종류 - @clubs/domain에서 가져옴
export { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

export enum ActivityDurationTypeEnum {
  Regular = 1, // 정규 활동 보고서
  Registration = 2, // 신규등록용 활동보고서
}
