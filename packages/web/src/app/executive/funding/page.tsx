"use client";

import { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ExecutivePastFundingDashboardSection from "@sparcs-clubs/web/features/executive/funding/components/ExecutivePastFundingDashboardSection";
import {
  defaultExecutiveFundingData,
  ExecutiveFundingContent,
} from "@sparcs-clubs/web/features/executive/funding/frames/ExecutiveFundingFrame";
import useGetExecutiveFundings from "@sparcs-clubs/web/features/executive/funding/services/useGetExecutiveFundings";

const ExecutiveFundingPageContent = () => {
  const {
    data: fundingsData,
    isLoading: isFundingsLoading,
    isError: isFundingsError,
  } = useGetExecutiveFundings();

  return (
    <AsyncBoundary isLoading={isFundingsLoading} isError={isFundingsError}>
      <ExecutiveFundingContent
        data={fundingsData ?? defaultExecutiveFundingData}
      />
      <ExecutivePastFundingDashboardSection
        activityDurations={fundingsData?.pastActivityDurations ?? []}
      />
    </AsyncBoundary>
  );
};

const ExecutiveFunding = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

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

  if (profile?.type !== UserTypeEnum.Executive) {
    return <NotFound />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "지원금 신청 내역", path: `/executive/funding` },
        ]}
        title="지원금 신청 내역"
      />
      <ExecutiveFundingPageContent />
    </FlexWrapper>
  );
};

export default ExecutiveFunding;
