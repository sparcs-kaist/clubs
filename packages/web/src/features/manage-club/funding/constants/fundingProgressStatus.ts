import { FundingStatusEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";

import {
  ProgressCheckSectionStatusEnum,
  StatusAndDate,
} from "@sparcs-clubs/web/common/components/ProgressStatus/_atomic/progressCheckStationStatus";

interface FundingProgressDetail {
  labels: string[];
  progress: StatusAndDate[];
}

/**
 * 지원금의 신청 상태를 반환합니다.
 * @param status 지원금 상태
 * @param date KST(Korea Standard Time) 기준 날짜
 */
const getFundingProgress = (
  status: FundingStatusEnum,
  editedAt: Date, // KST 기준 날짜
  commentedAt?: Date,
): FundingProgressDetail => {
  // date는 이미 KST로 들어오므로 추가 변환 불필요
  switch (status) {
    case FundingStatusEnum.Applied:
      return {
        labels: ["신청 완료", "승인 대기"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: editedAt },
        ],
      };
    case FundingStatusEnum.Approved:
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
    case FundingStatusEnum.Rejected:
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
    // TODO. 운위 승인 필요 케이스 수정 필요
    case FundingStatusEnum.Committee:
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
    case FundingStatusEnum.Partial:
      return {
        labels: ["신청 완료", "동아리 연합회 부분 승인"],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: undefined },
          {
            status: ProgressCheckSectionStatusEnum.Approved,
            date: commentedAt,
          },
        ],
      };
    default:
      throw new Error("Invalid funding status");
  }
};

export { getFundingProgress };
