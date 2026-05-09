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
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import ExecutiveFundingClubFrame from "@sparcs-clubs/web/features/executive/funding/frames/ExecutiveFundingClubFrame";

const ExecutiveFundingClub = () => {
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
    return <AsyncBoundary isLoading={loading} isError />;
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
            { name: "지원금 신청 내역", path: `/executive/funding` },
          ]}
          title={`지원금 신청 내역 (${data?.nameKr})`}
          enableLast
        />
        <ExecutiveFundingClubFrame clubId={id} />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveFundingClub;
