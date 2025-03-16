import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Info from "@sparcs-clubs/web/common/components/Info";
import { registerMemberDeadlineInfoText } from "@sparcs-clubs/web/features/clubs/constants";
import useGetMemberRegistrationPeriod from "@sparcs-clubs/web/features/clubs/hooks/useGetMemberRegistrationPeriod";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import RegisterMemberList from "../components/RegisterMemberList";

const RegisterMemberListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RegisterMemberListFrame = () => {
  const {
    data: { isMemberRegistrationPeriod, deadline },
    isLoading,
    isError,
  } = useGetMemberRegistrationPeriod();

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  if (!isMemberRegistrationPeriod) return null;

  return (
    <FoldableSectionTitle title="신청 회원 명단" childrenMargin="20px">
      <RegisterMemberListWrapper>
        <AsyncBoundary
          isLoading={isLoading || semesterLoading}
          isError={isError || semesterError}
        >
          {deadline && (
            <Info
              text={registerMemberDeadlineInfoText(deadline, semesterInfo)}
            />
          )}
        </AsyncBoundary>
        <RegisterMemberList />
      </RegisterMemberListWrapper>
    </FoldableSectionTitle>
  );
};

export default RegisterMemberListFrame;
