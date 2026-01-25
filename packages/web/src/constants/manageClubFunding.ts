import { ApiFnd007ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd007";
import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

import { fundingDeadlineEnumToString } from "../features/manage-club/funding/constants/fundingDeadlineEnumToString";
import { formatSimpleDateTime } from "../utils/Date/formatDate";

const manageClubFundingPageBreadCrumbName = "지원금";
const manageClubFundingPageName = "지원금";
const manageClubFundingPagePath = "/manage-club/funding";

const newFundingListSectionTitle = "신규 지원금 신청";
const newFundingListSectionInfoText = (data?: ApiFnd007ResponseOk) => {
  // 기간이 없거나 이의제기 기간인 경우 기간 정보를 표시하지 않음
  if (
    data?.deadline == null ||
    data?.deadline.deadlineEnum === FundingDeadlineEnum.Exception
  ) {
    return "현재는 지원금 신청 기간이 아닙니다.";
  }

  const targetDuration = data?.targetDuration;
  const status = fundingDeadlineEnumToString(data?.deadline.deadlineEnum);
  const endTerm = data?.deadline.endTerm;
  return `현재는 ${targetDuration?.year}년 ${targetDuration?.name}학기 지원금 ${status} 기간입니다 (${status} 마감 : ${endTerm ? formatSimpleDateTime(endTerm) : "-"})`;
};

const newFundingOrderButtonText = "지원금 신청 내역 추가";

const tableRowCountText = (count: number) => `총 ${count}개`;
// 임의로 부여한 이름이라 동연 번역에 맞춰야 할듯 합니다
const tableHeaderText = {
  status: "상태",
  activityName: "활동명",
  contentName: "항목명",
  expenditureAmount: "신청 금액",
  approvedAmount: "승인 금액",
};
const numberToKrWon = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

const pastFundingListSectionTitle = "과거 지원금 내역";
const singleSemesterFundingListSectionTitleText = (
  year: number,
  semester: string,
  itemCount: number,
) => `${year}년 ${semester}학기 (총 ${itemCount}개)`;

export {
  manageClubFundingPageBreadCrumbName,
  manageClubFundingPageName,
  manageClubFundingPagePath,
  newFundingListSectionInfoText,
  newFundingListSectionTitle,
  newFundingOrderButtonText,
  numberToKrWon,
  pastFundingListSectionTitle,
  singleSemesterFundingListSectionTitleText,
  tableHeaderText,
  tableRowCountText,
};
