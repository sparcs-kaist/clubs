"use client";

import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Info from "@sparcs-clubs/web/common/components/Info";
import ClubsListFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsListFrame";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import { registerMemberDeadlineInfoText } from "../constants";
import useGetMemberRegistrationPeriod from "../hooks/useGetMemberRegistrationPeriod";

const ClubsStudentFrame: React.FC = () => {
  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  const {
    data: { isMemberRegistrationPeriod, deadline },
    isLoading: isLoadingTerm,
    isError: isErrorTerm,
  } = useGetMemberRegistrationPeriod();

  return (
    <>
      <AsyncBoundary
        isLoading={isLoadingTerm || semesterLoading}
        isError={isErrorTerm || semesterError}
      >
        {isMemberRegistrationPeriod && deadline && (
          <Info text={registerMemberDeadlineInfoText(deadline, semesterInfo)} />
        )}
      </AsyncBoundary>
      <ClubsListFrame isRegistrationPeriod={isMemberRegistrationPeriod} />
    </>
  );
};

export default ClubsStudentFrame;
