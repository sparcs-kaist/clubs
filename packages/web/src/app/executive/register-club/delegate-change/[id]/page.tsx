"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegistrationDelegateChangeDetailFrame from "@sparcs-clubs/web/features/executive/register-club/frames/RegistrationDelegateChangeDetailFrame";

const ExecutiveRegistrationDelegateChangeDetail = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const clubId = Number(id);
  const isValidClubId = Number.isInteger(clubId) && clubId > 0;
  const isAuthLoading =
    isLoggedIn === undefined || (isLoggedIn && profile === undefined);

  if (isAuthLoading) return <AsyncBoundary isLoading isError={false} />;
  if (!isLoggedIn) return <LoginRequired login={login} />;
  if (profile?.type !== UserTypeEnum.Executive || !isValidClubId) {
    return <NotFound />;
  }

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          {
            name: "동아리 등록기간 중 대표자 변경",
            path: "/executive/register-club/delegate-change",
          },
        ]}
        title="대표자·대의원 변경"
        enableLast
      />
      <RegistrationDelegateChangeDetailFrame clubId={clubId} />
      <Link href="/executive/register-club/delegate-change">
        <Button type="outlined">목록으로 돌아가기</Button>
      </Link>
    </FlexWrapper>
  );
};

export default ExecutiveRegistrationDelegateChangeDetail;
