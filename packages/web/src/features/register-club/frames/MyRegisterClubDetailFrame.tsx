"use client";

import { useParams, useRouter } from "next/navigation";
import { styled } from "styled-components";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

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
  const { id } = useParams();
  const router = useRouter();

  const isProfessor = profile === UserTypeEnum.Professor;

  const {
    data: clubDetail,
    isLoading,
    isError,
  } = useGetRegisterClubDetail(profile, { applyId: +id });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <RegisterClubDetailFrame profile={profile} clubDetail={clubDetail!} />
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
          <ProfessorRegisterClubDetailButton clubDetail={clubDetail!} />
        ) : (
          <StudentRegisterClubDetailButton />
        )}
      </ButtonWrapper>
    </AsyncBoundary>
  );
};
export default MyRegisterClubDetailFrame;
