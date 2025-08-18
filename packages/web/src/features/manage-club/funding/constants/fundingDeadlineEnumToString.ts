import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

export const fundingDeadlineEnumToString = (deadline?: FundingDeadlineEnum) => {
  switch (deadline) {
    case FundingDeadlineEnum.Writing:
      return "신청";
    case FundingDeadlineEnum.Late:
      return "지연 제출";
    case FundingDeadlineEnum.Modification:
      return "수정";
    case FundingDeadlineEnum.Exception:
      return "이의 제기";
    case undefined:
      return "기간 없음";
    default:
      return "-";
  }
};
