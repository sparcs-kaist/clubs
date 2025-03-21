"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { styled } from "styled-components";

import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NotForExecutive from "@sparcs-clubs/web/common/frames/NotForExecutive";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ProfessorRegisterClubDetailButton from "@sparcs-clubs/web/features/my/register-club/frames/ProfessorRegisterClubDetailButton";
import StudentRegisterClubDetailButton from "@sparcs-clubs/web/features/my/register-club/frames/StudentRegisterClubDetailButton";
import RegisterClubDetailFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubDetailFrame";

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  justify-content: space-between;
`;

const MyRegisterClubDetail = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile?.type === UserTypeEnum.Executive) {
    return <NotForExecutive />;
  }

  if (!profile) {
    return <NotFound />;
  }

  const isProfessor = profile.type === UserTypeEnum.Professor;

  return (
    <FlexWrapper direction="column" gap={40}>
      <PageHead
        items={[
          { name: "마이페이지", path: "/my" },
          {
            name: "동아리 등록",
            path: "/my/register-club",
          },
        ]}
        title="동아리 등록"
      />
      <RegisterClubDetailFrame
        applyId={+id}
        profile={
          isProfessor ? UserTypeEnum.Professor : UserTypeEnum.Undergraduate
        }
      />
      <ButtonWrapper>
        <Button
          style={{ width: "max-content" }}
          onClick={() => {
            router.push("/my");
          }}
        >
          목록으로 돌아가기
        </Button>
        {profile?.type === UserTypeEnum.Professor ? (
          <ProfessorRegisterClubDetailButton />
        ) : (
          <StudentRegisterClubDetailButton />
        )}
      </ButtonWrapper>
    </FlexWrapper>
  );
};
export default MyRegisterClubDetail;
