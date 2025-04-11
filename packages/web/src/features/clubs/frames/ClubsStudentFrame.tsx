"use client";

import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Info from "@sparcs-clubs/web/common/components/Info";
import ClubsListFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsListFrame";

import { registerMemberDeadlineInfoText } from "../constants";
import useGetMemberRegistrationDeadline from "../services/useGetMemberRegistrationDeadline";

const ClubsStudentFrame: React.FC = () => {
  const {
    data,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetMemberRegistrationDeadline();

  return (
    <>
      <AsyncBoundary isLoading={isLoadingDeadline} isError={isErrorDeadline}>
        {data?.deadline && (
          <Info
            text={registerMemberDeadlineInfoText(
              data.deadline.endTerm,
              data.semester,
            )}
          />
        )}
      </AsyncBoundary>
      <ClubsListFrame isRegistrationPeriod={data?.deadline != null} />
    </>
  );
};

export default ClubsStudentFrame;
