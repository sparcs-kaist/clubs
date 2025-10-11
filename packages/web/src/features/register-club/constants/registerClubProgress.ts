import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import {
  ProgressCheckSectionStatusEnum,
  StatusAndDate,
} from "@sparcs-clubs/web/common/components/ProgressStatus/_atomic/progressCheckStationStatus";

interface RegisterClubProgressDetail {
  labels: string[];
  progress: StatusAndDate[];
}

const getRegisterClubProgress = (
  status: RegistrationStatusEnum,
  date: Date,
): RegisterClubProgressDetail => {
  switch (status) {
    case RegistrationStatusEnum.Pending:
      return {
        labels: ["신청 완료", "승인 대기"],
        progress: [{ status: ProgressCheckSectionStatusEnum.Approved, date }],
      };
    case RegistrationStatusEnum.Approved:
      return {
        labels: ["신청 완료", "동아리 연합회 신청 승인"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: undefined },
          { status: ProgressCheckSectionStatusEnum.Approved, date },
        ],
      };
    case RegistrationStatusEnum.Rejected:
      return {
        labels: ["신청 완료", "동아리 연합회 신청 반려"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: undefined },
          { status: ProgressCheckSectionStatusEnum.Canceled, date },
        ],
      };
    default:
      throw new Error("Invalid registration status");
  }
};

export { getRegisterClubProgress };
