import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

export const fundingDeadlineEnumToString = (deadline?: FundingDeadlineEnum) => {
  switch (deadline) {
    case FundingDeadlineEnum.Writing:
      return "신청";
    case FundingDeadlineEnum.Executive:
      return "집행부 검토";
    case FundingDeadlineEnum.Modification:
      return "수정 제출";
    case FundingDeadlineEnum.Exception:
      return "이의제기";
    case undefined:
      return "기간 없음";
    default:
      return "-";
  }
};
