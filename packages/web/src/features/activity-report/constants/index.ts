import { addDays, subSeconds } from "date-fns";

import { ApiAct018ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct018";
import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import { formatSimpleDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";

export const MAX_ACTIVITY_REPORT_COUNT = 20;

export const activityDeadlineEnumToString = (
  deadline?: ActivityDeadlineEnum,
) => {
  switch (deadline) {
    case ActivityDeadlineEnum.Writing:
      return "작성";
    case ActivityDeadlineEnum.Executive:
      return "집행부 검토";
    case ActivityDeadlineEnum.Modification:
      return "수정";
    case ActivityDeadlineEnum.Exception:
      return "이의제기";
    default:
      return "";
  }
};

export const newActivityReportListSectionInfoText = (
  data?: ApiAct018ResponseOk,
) => {
  // 기간이 없거나 이의제기 기간인 경우 기간 정보를 표시하지 않음
  if (
    data?.deadline == null ||
    data?.deadline.activityDeadlineEnum === ActivityDeadlineEnum.Exception
  ) {
    return "현재는 활동 보고서 기간이 아닙니다.";
  }

  const status = activityDeadlineEnumToString(
    data?.deadline.activityDeadlineEnum,
  );
  const endTerm = data?.deadline.duration.endTerm;
  return `현재는 ${data?.targetTerm.year}년 ${data?.targetTerm.name}학기 활동 보고서 ${status} 기간입니다 (${status} 마감 : ${endTerm ? formatSimpleDateTime(subSeconds(addDays(endTerm, 1), 1)) : "-"})`;
};
