"use client";

import React from "react";

import { ApiClb015ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb015";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import {
  manageClubFundingPageBreadCrumbName,
  manageClubFundingPageName,
  manageClubFundingPagePath,
} from "@sparcs-clubs/web/constants/manageClubFunding";
import NewFundingListSection from "@sparcs-clubs/web/features/manage-club/funding/components/NewFundingListSection";
import PastFundingListSection from "@sparcs-clubs/web/features/manage-club/funding/components/PastFundingListSection";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";

const Funding: React.FC = () => {
  const { data, isLoading, isError } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
    isLoading: boolean;
    isError: boolean;
  };

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          {
            name: manageClubFundingPageBreadCrumbName,
            path: manageClubFundingPagePath,
          },
        ]}
        title={manageClubFundingPageName}
      />
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <NewFundingListSection clubId={data?.clubId} />
        <PastFundingListSection clubId={data?.clubId} />
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default Funding;
