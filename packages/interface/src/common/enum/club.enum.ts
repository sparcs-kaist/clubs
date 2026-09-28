export const ClubTypeEnum = {
  Regular: 1, // 정동아리
  Provisional: 2, // 가동아리
  RegistrationCanceled: 3, // 등록취소
  Special: 4, // 특수등록
  Unregistered: 5, // 미등록
} as const;

export type ClubTypeEnum = (typeof ClubTypeEnum)[keyof typeof ClubTypeEnum];

export const ClubDelegateEnum = {
  Representative: 1, // 대표자
  Delegate1: 2, // 대의원 1
  Delegate2: 3, // 대의원 2
} as const;

export type ClubDelegateEnum =
  (typeof ClubDelegateEnum)[keyof typeof ClubDelegateEnum];

export const ClubDelegateChangeRequestStatusEnum = {
  Applied: 1, // 제출
  Approved: 2, // 승인
  Rejected: 3, // 반려
} as const;

export type ClubDelegateChangeRequestStatusEnum =
  (typeof ClubDelegateChangeRequestStatusEnum)[keyof typeof ClubDelegateChangeRequestStatusEnum];

export const ClubBuildingEnum = {
  Taeul: 1, // 태울관(N13)
  Store: 2, // 매점건물, 학부학생회관별관(N12)
  Post: 3, // 우체국건물, 학부학생회관(N11)
  Sports: 4, // 스포츠컴플렉스(N10)
} as const;

export type ClubBuildingEnum =
  (typeof ClubBuildingEnum)[keyof typeof ClubBuildingEnum];
