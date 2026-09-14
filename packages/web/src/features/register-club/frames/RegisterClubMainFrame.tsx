import React from "react";

import {
  getDisplayNameRegistration,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import RestoreDraftModal from "@sparcs-clubs/web/common/components/Modal/RestoreDraftModal";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import RegisterClubForm from "../components/RegisterClubForm";
import { registerClubDeadlineInfoText } from "../constants";
import useRegistrationDraft from "../hooks/useRegistrationDraft";

interface RegisterClubMainFrameProps {
  type: RegistrationTypeEnum;
  deadline: Date | null;
}

const RegisterClubMainFrame: React.FC<RegisterClubMainFrameProps> = ({
  type,
  deadline = undefined,
}) => {
  const {
    savedData,
    isLoading: isDraftLoading,
    isModalOpen,
    handleConfirm,
    handleClose,
  } = useRegistrationDraft(type);
  let registrationName: string = getDisplayNameRegistration(type);
  if (type === RegistrationTypeEnum.NewProvisional) {
    registrationName = "가등록(신규)";
  } else if (type === RegistrationTypeEnum.ReProvisional) {
    registrationName = "가등록(재)";
  }

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          {
            name: `동아리 등록`,
            path: `/register-club`,
          },
        ]}
        title={`동아리 ${registrationName} 신청`}
        enableLast
      />
      <AsyncBoundary isLoading={semesterLoading} isError={semesterError}>
        {deadline ? (
          <Info text={registerClubDeadlineInfoText(deadline, semesterInfo)} />
        ) : (
          <Info text="현재는 동아리 등록 기간이 아닙니다" />
        )}
      </AsyncBoundary>
      <AsyncBoundary isLoading={isDraftLoading} isError={false}>
        {isModalOpen ? (
          <RestoreDraftModal
            isOpen={isModalOpen}
            mainText={`${registrationName} 신청에서 작성하시던 내역이 있습니다. 불러오시겠습니까?`}
            onConfirm={handleConfirm}
            onClose={handleClose}
          />
        ) : (
          <RegisterClubForm type={type} initialData={savedData} />
        )}
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default RegisterClubMainFrame;
