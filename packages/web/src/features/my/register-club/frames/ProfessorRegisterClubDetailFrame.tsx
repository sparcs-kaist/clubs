import { useParams } from "next/navigation";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useRegisterClubDetail from "@sparcs-clubs/web/features/register-club/hooks/useGetRegisterClubDetail";

import MyRegisterClubDetailFrame from "./MyRegisterClubDetailFrame";

const ProfessorRegisterClubDetailFrame: React.FC<{ userType: string }> = ({
  userType,
}) => {
  const { id } = useParams();

  const {
    data: clubDetail,
    isLoading,
    isError,
  } = useRegisterClubDetail("professor", { applyId: +id });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {clubDetail && (
        <MyRegisterClubDetailFrame
          userType={userType}
          clubDetail={clubDetail}
        />
      )}
    </AsyncBoundary>
  );
};

export default ProfessorRegisterClubDetailFrame;
