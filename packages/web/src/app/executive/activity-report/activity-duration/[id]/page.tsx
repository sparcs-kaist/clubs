"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import {
  defaultExecutiveActivityReportData,
  ExecutiveActivityReportContent,
} from "@sparcs-clubs/web/features/activity-report/frames/executive/ExecutiveActivityReportFrame";
import useGetExecutiveActivities from "@sparcs-clubs/web/features/activity-report/services/executive/useGetExecutiveActivities";
import formatActivityDurationName from "@sparcs-clubs/web/features/activity-report/utils/formatActivityDurationName";

interface ExecutiveActivityReportDurationContentProps {
  activityDurationId: number;
}

const ExecutiveActivityReportDurationContent = ({
  activityDurationId,
}: ExecutiveActivityReportDurationContentProps) => {
  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
  } = useGetExecutiveActivities({
    pageOffset: 1,
    itemCount: 150,
    activityDurationId,
  });

  if (isActivitiesError) {
    return <NotFound />;
  }

  return (
    <AsyncBoundary isLoading={isActivitiesLoading} isError={isActivitiesError}>
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            {
              name: "활동 보고서 작성 내역",
              path: "/executive/activity-report",
            },
          ]}
          title={`활동 보고서 작성 내역 (${formatActivityDurationName(activitiesData?.activityDuration)})`}
          enableLast
        />
        <ExecutiveActivityReportContent
          data={activitiesData ?? defaultExecutiveActivityReportData}
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

const ExecutiveActivityReportDuration = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  const parsedActivityDurationId = Number(id);
  const isValidActivityDurationId =
    Number.isInteger(parsedActivityDurationId) && parsedActivityDurationId > 0;

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

  if (profile?.type !== UserTypeEnum.Executive || !isValidActivityDurationId) {
    return <NotFound />;
  }

  return (
    <ExecutiveActivityReportDurationContent
      activityDurationId={parsedActivityDurationId}
    />
  );
};

export default ExecutiveActivityReportDuration;
