"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ExecutiveActivityReportClubFrame from "@sparcs-clubs/web/features/activity-report/frames/executive/ExecutiveActivityReportClubFrame";
import useGetActivityTerms from "@sparcs-clubs/web/features/activity-report/services/useGetActivityTerms";
import { ActivityTerm } from "@sparcs-clubs/web/features/activity-report/types/activityTerm";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";

const ExecutiveActivityReportClub = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const { id } = useParams<{ id: string }>();

  const { data: activityTermsData } = useGetActivityTerms({
    clubId: Number(id),
  });
  const { data, isLoading, isError } = useGetClubDetail(id as string);

  const activityTermList: ActivityTerm[] = useMemo(
    () =>
      activityTermsData?.terms.map(term => ({
        id: term.id,
        name: term.name,
        startTerm: term.startTerm, // 이미 Date 타입이라면 그대로
        endTerm: term.endTerm,
        year: term.year,
      })) ?? [],
    [activityTermsData],
  );

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
      <FlexWrapper direction="column" gap={20}>
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
        <ExecutiveActivityReportClubFrame
          clubId={id}
          activityTerms={activityTermList}
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportClub;
