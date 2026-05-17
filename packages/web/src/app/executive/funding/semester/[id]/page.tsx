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
  defaultExecutiveFundingData,
  ExecutiveFundingContent,
} from "@sparcs-clubs/web/features/executive/funding/frames/ExecutiveFundingFrame";
import useGetExecutiveFundings from "@sparcs-clubs/web/features/executive/funding/services/useGetExecutiveFundings";
import formatActivityDurationName from "@sparcs-clubs/web/features/executive/funding/utils/formatActivityDuration";

interface ExecutiveFundingSemesterContentProps {
  semesterId: number;
}

const ExecutiveFundingSemesterContent = ({
  semesterId,
}: ExecutiveFundingSemesterContentProps) => {
  const {
    data: fundingsData,
    isLoading: isFundingsLoading,
    isError: isFundingsError,
  } = useGetExecutiveFundings({ semesterId });

  if (isFundingsError) {
    return <NotFound />;
  }

  return (
    <AsyncBoundary isLoading={isFundingsLoading} isError={isFundingsError}>
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            { name: "지원금 신청 내역", path: "/executive/funding" },
          ]}
          title={`지원금 신청 내역 (${formatActivityDurationName(fundingsData?.activityDuration)})`}
          enableLast
        />
        <ExecutiveFundingContent
          data={fundingsData ?? defaultExecutiveFundingData}
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

const ExecutiveFundingSemester = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  const parsedSemesterId = Number(id);
  const isValidSemesterId =
    Number.isInteger(parsedSemesterId) && parsedSemesterId > 0;

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

  if (profile?.type !== UserTypeEnum.Executive || !isValidSemesterId) {
    return <NotFound />;
  }

  return <ExecutiveFundingSemesterContent semesterId={parsedSemesterId} />;
};

export default ExecutiveFundingSemester;
