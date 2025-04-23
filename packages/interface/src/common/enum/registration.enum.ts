enum RegistrationTypeEnum {
  Renewal = 1, // 동아리 재등록 신청
  Promotional, // 동아리 신규 등록
  NewProvisional, // 가동아리 신규 등록 신청
  ReProvisional, // 가동아리 재등록 신청
}

export enum RegistrationStatusEnum {
  Pending = 1, // 대기중
  Approved, // 승인됨
  Rejected, // 반려됨
}

export enum RegistrationDeadlineEnum {
  ClubRegistrationApplication = 1, // 동아리 등록 신청 기간, 동연 요청으로 이 기간에 동아리 등롯 신청 생성/검토/수정/승인을 전부 진행합니다.
  ClubRegistrationLate, // 동아리 등록 신청 지연 제출 기간, 동아리 등록 신청 기간 종료 후 2주 정도
  StudentRegistrationApplication, // 회원 등록 신청 기간
  StudentRegistrationLate, // 회원 등록 신청 지연 제출 기간, 회원 등록 신청 기간 종료 후 2주 정도
}

export enum RegistrationApplicationStudentStatusEnum {
  Pending = 1, // 대기중
  Approved, // 승인됨
  Rejected, // 반려됨
}

export const getDisplayNameRegistration = (
  type: RegistrationTypeEnum | undefined,
) => {
  switch (type) {
    case RegistrationTypeEnum.Renewal:
      return "재등록";
    case RegistrationTypeEnum.Promotional:
      return "신규 등록";
    case RegistrationTypeEnum.NewProvisional:
    case RegistrationTypeEnum.ReProvisional:
      return "가등록";
    default:
      return "";
  }
};

export const getEnumRegistration = (string: string) => {
  switch (string) {
    case "재등록":
      return [1];
    case "신규 등록":
      return [2];
    case "가등록":
      return [3, 4];
    default:
      return 0;
  }
};

export { RegistrationTypeEnum };
