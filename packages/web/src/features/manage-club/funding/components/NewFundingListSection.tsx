"use client";

import { useRouter } from "next/navigation";
import React from "react";
import styled from "styled-components";

import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Info from "@sparcs-clubs/web/common/components/Info";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  newFundingListSectionInfoText,
  newFundingListSectionTitle,
  newFundingOrderButtonText,
} from "@sparcs-clubs/web/constants/manageClubFunding";
import { formatSimpleDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";

import { FUNDING_TABLE_NO_ACTIVITY_NAME } from "../constants";
import useGetFundingDeadline from "../services/useGetFundingDeadline";
import useGetNewFundingList from "../services/useGetNewFundingList";
import NewFundingListTable from "./_atomic/NewFundingListTable";

interface NewFundingListSectionProps {
  clubId: number;
}
const NewFundingOrderButtonRow = styled.div`
  /* Auto layout */
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;

  width: 100%;

  /* Inside auto layout */
  /* flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0; */
`;

const NewFundingListSection: React.FC<NewFundingListSectionProps> = ({
  clubId,
}) => {
  const router = useRouter();
  const createFundingClick = () => {
    router.push(`/manage-club/funding/create`);
  };

  const {
    data: newFundingList,
    isLoading: isLoadingNewFundingList,
    isError: isErrorNewFundingList,
  } = useGetNewFundingList({
    clubId,
  });

  const {
    data: fundingDeadline,
    isLoading: isLoadingFundingDeadline,
    isError: isErrorFundingDeadline,
  } = useGetFundingDeadline();

  return (
    <FoldableSectionTitle title={newFundingListSectionTitle}>
      <FlexWrapper direction="column" gap={20}>
        <AsyncBoundary
          isLoading={isLoadingFundingDeadline}
          isError={isErrorFundingDeadline}
        >
          <Info text={newFundingListSectionInfoText(fundingDeadline)}>
            {fundingDeadline?.objectionDeadline &&
              fundingDeadline.deadline?.deadlineEnum !==
                FundingDeadlineEnum.Exception && (
                <Typography>
                  이의제기 마감{" "}
                  {formatSimpleDateTime(fundingDeadline.objectionDeadline)}
                </Typography>
              )}
          </Info>
        </AsyncBoundary>
        <NewFundingOrderButtonRow>
          <IconButton icon="add" type="default" onClick={createFundingClick}>
            {newFundingOrderButtonText}
          </IconButton>
        </NewFundingOrderButtonRow>
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
    </FoldableSectionTitle>
  );
};

export default NewFundingListSection;
