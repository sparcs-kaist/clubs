"use client";

import { useParams, useRouter } from "next/navigation";
import { styled } from "styled-components";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import ProfessorRegisterClubDetailButton from "@sparcs-clubs/web/features/my/register-club/frames/ProfessorRegisterClubDetailButton";
import StudentRegisterClubDetailButton from "@sparcs-clubs/web/features/my/register-club/frames/StudentRegisterClubDetailButton";
import RegisterClubDetailFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubDetailFrame";

import useGetRegisterClubDetail from "../services/useGetRegisterClubDetail";

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  justify-content: space-between;
`;

const MyRegisterClubDetailFrame = ({ profile }: { profile: UserTypeEnum }) => {
  const { id: idParam } = useParams<{ id: string }>();
  const parsedApplyId = Number(idParam);
  const isValidApplyId = Number.isInteger(parsedApplyId) && parsedApplyId > 0;
  const applyId = isValidApplyId ? parsedApplyId : 0;
  const router = useRouter();

  const isProfessor = profile === UserTypeEnum.Professor;

  const {
    data: clubDetail,
    isLoading,
    isError,
  } = useGetRegisterClubDetail(
    profile,
    { applyId },
    {
      enabled: isValidApplyId,
    },
  );

  if (!isValidApplyId) {
    return <NotFound />;
  }

  if (!clubDetail) {
    return null;
  }

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <RegisterClubDetailFrame profile={profile} clubDetail={clubDetail} />
      <ButtonWrapper>
        <Button
          style={{ width: "max-content" }}
          onClick={() => {
            router.push("/my");
          }}
        >
          목록으로 돌아가기
        </Button>
        {isProfessor ? (
          <ProfessorRegisterClubDetailButton clubDetail={clubDetail} />
        ) : (
          <StudentRegisterClubDetailButton />
        )}
      </ButtonWrapper>
    </AsyncBoundary>
  );
};
export default MyRegisterClubDetailFrame;
