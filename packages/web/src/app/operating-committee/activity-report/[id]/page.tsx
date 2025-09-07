"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ActivityReportDetailFrame from "@sparcs-clubs/web/features/activity-report/frames/ActivityReportDetailFrame";

const ExecutiveActivityReportDetail = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  const operatingCommitteeSecret = searchParams.get(
    "operating-committee-secret",
  );

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn || !profile) {
    return <LoginRequired login={login} />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "운영위원 페이지", path: "/operating-committee" },
          {
            name: "운영위원 활동 보고서 조회",
            path: "/",
          },
        ]}
        title="운영위원 활동 보고서 조회"
      />
      <ActivityReportDetailFrame
        profile={profile}
        isOperatingCommittee
        operatingCommitteeSecret={operatingCommitteeSecret ?? undefined}
      />
    </FlexWrapper>
  );
};

export default ExecutiveActivityReportDetail;
