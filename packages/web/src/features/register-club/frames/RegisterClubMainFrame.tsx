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
import useTemporaryStorage from "@sparcs-clubs/web/common/hooks/useTemporaryStorage";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import RegisterClubForm from "../components/RegisterClubForm";
import { registerClubDeadlineInfoText } from "../constants";
import { RegisterClubModel } from "../types/registerClub";

interface RegisterClubMainFrameProps {
  type: RegistrationTypeEnum;
  deadline: Date | null;
}

const RegisterClubMainFrame: React.FC<RegisterClubMainFrameProps> = ({
  type,
  deadline = undefined,
}) => {
  const { savedData, isModalOpen, handleConfirm, handleClose } =
    useTemporaryStorage<RegisterClubModel>(LOCAL_STORAGE_KEY.REGISTER_CLUB);

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
        title={`동아리 ${getDisplayNameRegistration(type)} 신청`}
        enableLast
      />
      <AsyncBoundary isLoading={semesterLoading} isError={semesterError}>
        {deadline ? (
          <Info text={registerClubDeadlineInfoText(deadline, semesterInfo)} />
        ) : (
          <Info text="현재는 동아리 등록 기간이 아닙니다" />
        )}
      </AsyncBoundary>
      {isModalOpen ? (
        <RestoreDraftModal
          isOpen={isModalOpen}
          mainText="선택한 타입의 등록, 혹은 다른 타입의 동아리 등록 신청에서 작성하시던 내역이 있습니다. 불러오시겠습니까?"
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      ) : (
        <RegisterClubForm type={type} initialData={savedData} />
      )}
    </FlexWrapper>
  );
};

export default RegisterClubMainFrame;
