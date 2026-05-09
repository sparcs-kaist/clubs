"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ExecutiveActivityReportClubFrame from "@sparcs-clubs/web/features/activity-report/frames/executive/ExecutiveActivityReportClubFrame";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";

const ExecutiveActivityReportClub = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useGetClubDetail(id as string);

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  if (loading) {
    return <AsyncBoundary isLoading={loading && isLoading} isError={isError} />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile?.type !== UserTypeEnum.Executive) {
    return <Custom404 />;
  }

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            {
              name: "활동 보고서 작성 내역",
              path: `/executive/activity-report`,
            },
          ]}
          title={`활동 보고서 작성 내역 (${data?.nameKr})`}
          enableLast
        />
        <ExecutiveActivityReportClubFrame clubId={id} />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportClub;
