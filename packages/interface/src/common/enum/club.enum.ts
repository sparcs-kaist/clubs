export enum ClubTypeEnum {
  Regular = 1, // 정동아리
  Provisional, // 가동아리
  RegistrationCanceled, // 등록취소
  Special, // 특수등록
  Unregistered, // 미등록
}

export enum ClubDelegateEnum {
  Representative = 1, // 대표자
  Delegate1, // 대의원 1
  Delegate2, // 대의원 2
}

export enum ClubDelegateChangeRequestStatusEnum {
  Applied = 1, // 제출
  Approved, // 승인
  Rejected, // 반려
}

export enum ClubBuildingEnum {
  Taeul = 1, // 태울관(N13)
  Store, // 매점건물, 학부학생회관별관(N12)
  Post, // 우체국건물, 학부학생회관(N11)
  Sports, // 스포츠컴플렉스(N10)
}
