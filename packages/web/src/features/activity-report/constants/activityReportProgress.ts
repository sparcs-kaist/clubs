import { ActivityStatusEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";

import {
  ProgressCheckSectionStatusEnum,
  StatusAndDate,
} from "@sparcs-clubs/web/common/components/ProgressStatus/_atomic/progressCheckStationStatus";

interface ActivityReportProgressDetail {
  labels: string[];
  progress: StatusAndDate[];
}

/**
 * 활동 보고서의 진행 상태를 반환합니다.
 * @param status 활동 보고서 상태
 * @param date KST(Korea Standard Time) 기준 날짜
 */
const getActivityReportProgress = (
  status: ActivityStatusEnum,
  editedAt: Date, // KST 기준 날짜
  commentedAt: Date | undefined, // KST 기준 날짜
): ActivityReportProgressDetail => {
  // date는 이미 KST로 들어오므로 추가 변환 불필요
  switch (status) {
    case ActivityStatusEnum.Applied:
      return {
        labels: ["신청 완료", "승인 대기"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: editedAt },
        ],
      };
    case ActivityStatusEnum.Approved:
      return {
        labels: ["신청 완료", "동아리 연합회 승인 완료"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: undefined },
          {
            status: ProgressCheckSectionStatusEnum.Approved,
            date: commentedAt,
          },
        ],
      };
    case ActivityStatusEnum.Rejected:
      return {
        labels: ["신청 완료", "동아리 연합회 신청 반려"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: undefined },
          {
            status: ProgressCheckSectionStatusEnum.Canceled,
            date: commentedAt,
          },
        ],
      };
    case ActivityStatusEnum.Committee:
      return {
        labels: ["신청 완료", "운위 승인 필요"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: undefined },
          {
            status: ProgressCheckSectionStatusEnum.Pending,
            date: commentedAt,
          },
        ],
      };
    default:
      throw new Error("Invalid activity report status");
  }
};

export { getActivityReportProgress };
