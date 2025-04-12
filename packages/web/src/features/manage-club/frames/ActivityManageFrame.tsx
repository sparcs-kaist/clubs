import React from "react";

import { ApiClb015ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb015";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import CurrentActivityReportTable from "@sparcs-clubs/web/features/activity-report/components/CurrentActivityReportTable";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";

import NewFundingListTable from "../funding/components/_atomic/NewFundingListTable";
import { FUNDING_TABLE_NO_ACTIVITY_NAME } from "../funding/constants";
import useGetNewFundingList from "../funding/services/useGetNewFundingList";

const ActivityManageFrame: React.FC = () => {
  const { data } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
    isLoading: boolean;
  };

  const {
    data: newFundingList,
    isLoading: isLoadingNewFundingList,
    isError: isErrorNewFundingList,
  } = useGetNewFundingList({
    clubId: data.clubId,
  });

  return (
    <FoldableSectionTitle title="동아리 활동">
      <FlexWrapper direction="column" gap={40}>
        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title="활동 보고서"
            moreDetail="내역 더보기"
            moreDetailPath="/manage-club/activity-report"
          />
          <CurrentActivityReportTable clubId={data.clubId} />
        </FlexWrapper>

        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title="지원금"
            moreDetail="내역 더보기"
            moreDetailPath="/manage-club/funding"
          />
          <AsyncBoundary
            isLoading={isLoadingNewFundingList}
            isError={isErrorNewFundingList}
          >
            <NewFundingListTable
              newFundingList={newFundingList?.fundings
                .map(funding => ({
                  ...funding,
                  activityName:
                    funding.purposeActivity?.name ??
                    FUNDING_TABLE_NO_ACTIVITY_NAME,
                }))
                .sort((a, b) => a.fundingStatusEnum - b.fundingStatusEnum)}
            />
          </AsyncBoundary>
        </FlexWrapper>
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};

export default ActivityManageFrame;
