import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import WarningInfo from "@sparcs-clubs/web/common/components/WarningInfo";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";
import RegisterClubMainFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubMainFrame";

import useClubRegistrationEligibility from "../hooks/useClubRegistrationEligibility";

const RegisterClubAuthFrame: React.FC<{
  type: RegistrationTypeEnum;
}> = ({ type }) => {
  const router = useRouter();
  const { deadline, registrationPath, isLoading, getUnavailableReason } =
    useClubRegistrationEligibility();
  const reason = getUnavailableReason(type);

  const [authorized, setAuthorized] = useState<{
    type: RegistrationTypeEnum;
    deadline: Date;
  }>();
  const currentDeadline = deadline?.deadline?.endTerm;
  const navigationText = registrationPath
    ? "신청 내역 확인"
    : "등록 유형 다시 선택";
  const navigate = () => router.push(registrationPath ?? "/register-club");

  useEffect(() => {
    setAuthorized(previous => {
      if (previous?.type === type) return previous;
      if (reason === null && currentDeadline)
        return { type, deadline: currentDeadline };
      return undefined;
    });
  }, [type, reason, currentDeadline]);

  if (authorized?.type !== type) {
    if (isLoading || reason === null)
      return <AsyncBoundary isLoading isError={false} />;
    return (
      <ErrorPageTemplate
        message={<ErrorMessage>{reason}</ErrorMessage>}
        buttons={[{ text: navigationText, onClick: navigate }]}
      />
    );
  }

  const disabled = isLoading || reason !== null;
  return (
    <FlexWrapper direction="column" gap={20}>
      {reason && (
        <WarningInfo linkText={navigationText} onClickLink={navigate}>
          {reason}
        </WarningInfo>
      )}
      <fieldset
        key={type}
        disabled={disabled}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        onSubmitCapture={event => {
          if (getUnavailableReason(type) !== null) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <RegisterClubMainFrame type={type} deadline={authorized.deadline} />
      </fieldset>
    </FlexWrapper>
  );
};

export default RegisterClubAuthFrame;
