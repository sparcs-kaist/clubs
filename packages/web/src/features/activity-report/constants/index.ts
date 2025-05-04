import { getDate, getMonth, getYear } from "date-fns";

import { ApiAct018ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct018";
import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

export const MAX_ACTIVITY_REPORT_COUNT = 20;

export const activityDeadlineEnumToString = (
  deadline?: ActivityDeadlineEnum,
) => {
  switch (deadline) {
    case ActivityDeadlineEnum.Writing:
      return "작성";
    case ActivityDeadlineEnum.Late:
      return "지연 제출";
    case ActivityDeadlineEnum.Modification:
      return "수정";
    case ActivityDeadlineEnum.Exception:
      return "예외";
    default:
      return "";
  }
};

export const newActivityReportListSectionInfoText = (
  data?: ApiAct018ResponseOk,
) => {
  if (data?.deadline == null) {
    return "현재는 활동 보고서 기간이 아닙니다.";
  }

  const status = activityDeadlineEnumToString(
    data?.deadline.activityDeadlineEnum,
  );
  const endTerm = data?.deadline.duration.endTerm;
  return `현재는 ${data?.targetTerm.year}년 ${data?.targetTerm.name}학기 활동 보고서 ${status} 기간입니다 (${status} 마감 : ${endTerm ? `${getYear(endTerm)}년 ${getMonth(endTerm) + 1}월 ${getDate(endTerm)}일 23:59` : "-"})`;
};
