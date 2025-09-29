"use client";

import React from "react";

import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";

const ProfessorRegistrationBanner: React.FC = () => {
  const {
    data: clubRegistrationData,
    isLoading,
    isError,
  } = useGetClubRegistrationDeadline();

  if (isLoading || isError) return null;

  // deadline이 존재할 때만 배너 표시
  if (!clubRegistrationData?.deadline) {
    return null;
  }

  return (
    <Banner icon="warning">
      동아리 등록 신청서는 이 페이지 하단에서 확인하실 수 있으며, 동아리 등록
      신청서는 학기 역순으로 정렬되어 있습니다.
      <br />
      표에 나와있는 승인 상태는 지도교수님 승인 상태와는 별개이므로, 실제 승인
      상태는 동아리 등록 신청서에서 확인하실 수 있습니다.
    </Banner>
  );
};

export default ProfessorRegistrationBanner;
