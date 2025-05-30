"use client";

import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import NotActivityReportPeriod from "@sparcs-clubs/web/common/frames/NotActivityReportCreatePeriod";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ActivityReportCreateFrame from "@sparcs-clubs/web/features/activity-report/frames/ActivityReportCreateFrame";
import useGetActivityDeadline from "@sparcs-clubs/web/features/activity-report/services/useGetActivityDeadline";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";

const ActivityReportCreate: React.FC = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const { data, isLoading, isError } = useGetMyManageClub();
  const {
    data: deadlineData,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetActivityDeadline();

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

  if (profile?.type !== UserTypeEnum.Undergraduate) {
    return <NoManageClub />;
  }

  if (!data || !("clubId" in data)) {
    return <AsyncBoundary isLoading={isLoading} isError={isError} />;
  }

  if (deadlineData?.deadline == null) {
    return (
      <AsyncBoundary isLoading={isLoadingDeadline} isError={isErrorDeadline} />
    );
  }
  if (!deadlineData.isWritable) {
    return <NotActivityReportPeriod type="write" />;
  }

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ActivityReportCreateFrame clubId={data.clubId} />
    </AsyncBoundary>
  );
};

export default ActivityReportCreate;
