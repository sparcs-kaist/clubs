import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Info from "@sparcs-clubs/web/common/components/Info";
import { registerMemberDeadlineInfoText } from "@sparcs-clubs/web/features/clubs/constants";
import useGetMemberRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetMemberRegistrationDeadline";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import RegisterMemberList from "../components/RegisterMemberList";

const RegisterMemberListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RegisterMemberListFrame = () => {
  const {
    data,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetMemberRegistrationDeadline();

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  if (data?.deadline == null) return null;

  return (
    <FoldableSectionTitle title="신청 회원 명단" childrenMargin="20px">
      <RegisterMemberListWrapper>
        <AsyncBoundary
          isLoading={isLoadingDeadline || semesterLoading}
          isError={isErrorDeadline || semesterError}
        >
          {data.deadline && (
            <Info
              text={registerMemberDeadlineInfoText(
                data.deadline.endTerm,
                semesterInfo,
              )}
            />
          )}
        </AsyncBoundary>
        <RegisterMemberList />
      </RegisterMemberListWrapper>
    </FoldableSectionTitle>
  );
};

export default RegisterMemberListFrame;
