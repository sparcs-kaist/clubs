import { useParams } from "next/navigation";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useGetClubRegistrationProfessor from "@sparcs-clubs/web/features/my/services/getProfessorClubRegistration";

import MyRegisterClubDetailFrame from "./MyRegisterClubDetailFrame";

const ProfessorRegisterClubDetailFrame: React.FC<{ userType: string }> = ({
  userType,
}) => {
  const { id } = useParams();

  const {
    data: clubDetail,
    isLoading,
    isError,
  } = useGetClubRegistrationProfessor({ applyId: +id });

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
