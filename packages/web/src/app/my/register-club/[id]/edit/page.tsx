"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getDisplayNameRegistration } from "@clubs/interface/common/enum/registration.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NotForExecutive from "@sparcs-clubs/web/common/frames/NotForExecutive";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyRegisterClubEditFrame from "@sparcs-clubs/web/features/my/register-club/frames/MyRegisterClubEditFrame";
import useGetRegisterClubDetail from "@sparcs-clubs/web/features/register-club/services/useGetRegisterClubDetail";

const MyRegisterClubEdit = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  const { id: applyIdParam } = useParams<{ id: string }>();
  const parsedApplyId = Number(applyIdParam);
  const isValidApplyId = Number.isInteger(parsedApplyId) && parsedApplyId > 0;
  const applyId = isValidApplyId ? parsedApplyId : 0;
  const {
    data: detail,
    isLoading,
    isError,
  } = useGetRegisterClubDetail(
    profile?.type as UserTypeEnum,
    {
      applyId,
    },
    { enabled: isValidApplyId },
  );

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (!isValidApplyId) {
    return <Custom404 />;
  }

  if (profile?.type === UserTypeEnum.Executive) {
    return <NotForExecutive />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          {
            name: `마이페이지`,
            path: `/my`,
          },
          {
            name: `동아리 등록`,
            path: `/my/register-club/${applyId}`,
          },
        ]}
        title={`동아리 ${getDisplayNameRegistration(detail?.registrationTypeEnumId)} 신청 수정`}
        enableLast
      />
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <MyRegisterClubEditFrame applyId={applyId} initialData={detail} />
      </AsyncBoundary>
    </FlexWrapper>
  );
};
export default MyRegisterClubEdit;
