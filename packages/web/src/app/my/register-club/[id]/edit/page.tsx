"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import ErrorModal from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NotForExecutive from "@sparcs-clubs/web/common/frames/NotForExecutive";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyRegisterClubEditFrame from "@sparcs-clubs/web/features/my/register-club/frames/MyRegisterClubEditFrame";
import useGetRegisterClubDetail from "@sparcs-clubs/web/features/register-club/services/useGetRegisterClubDetail";

const MyRegisterClubEdit = () => {
  const t = useTranslations("my.registration");
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
  const isApproved =
    detail?.registrationStatusEnumId === RegistrationStatusEnum.Approved;

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (!isValidApplyId) {
    return <NotFound />;
  }

  if (isApproved) {
    return (
      <ErrorModal
        isOpen
        message={t("approvedNotEditable")}
        onConfirm={() => router.replace(`/my/register-club/${applyId}`)}
      />
    );
  }

  if (profile?.type === UserTypeEnum.Executive) {
    return <NotForExecutive />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          {
            name: t("myPage"),
            path: `/my`,
          },
          {
            name: t("title"),
            path: `/my/register-club/${applyId}`,
          },
        ]}
        title={t("editTitle", {
          type: detail ? t(`types.${detail.registrationTypeEnumId}`) : "",
        })}
        enableLast
      />
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <MyRegisterClubEditFrame applyId={applyId} initialData={detail} />
      </AsyncBoundary>
    </FlexWrapper>
  );
};
export default MyRegisterClubEdit;
