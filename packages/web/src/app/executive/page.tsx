"use client";

import React, { useEffect, useState } from "react";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ExecutiveDashboardFrame from "@sparcs-clubs/web/features/executive/frames/ExecutiveDashboardFrame";

const ExecutiveActivityReport = () => {
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

  if (profile?.type !== "executive") {
    return <Custom404 />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "집행부원 대시보드", path: "/executive" }]}
        title="집행부원 대시보드"
      />
      <ExecutiveDashboardFrame />
    </FlexWrapper>
  );
};

export default ExecutiveActivityReport;
