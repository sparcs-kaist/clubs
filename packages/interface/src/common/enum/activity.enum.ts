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

// 활동보고서 기간 종류
// 작성 | 지연 제출 | 수정 | 예외 기간 << 집행부 수정 정도?
export enum ActivityDeadlineEnum {
  Writing = 1, // 작성
  Late, // 지연 제출기간, upload 기간 종료 후 수정제출 기간 전까지
  Modification, // 수정 제출
  Exception, // 예외: 이의제기를 어떻게 적용해주지? 일단 킵
}

export enum ActivityDurationTypeEnum {
  Regular = 1, // 정규 활동 보고서
  Registration = 2, // 신규등록용 활동보고서
}
