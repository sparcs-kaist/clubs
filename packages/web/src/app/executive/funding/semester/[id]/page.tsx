"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import ExecutiveFundingFrame from "@sparcs-clubs/web/features/executive/funding/frames/ExecutiveFundingFrame";

const ExecutiveFundingSemester = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  const parsedSemesterId = Number(id);
  const isValidSemesterId =
    Number.isInteger(parsedSemesterId) && parsedSemesterId > 0;

  const {
    data: semestersData,
    isLoading: isSemestersLoading,
    isError: isSemestersError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const semester = useMemo(
    () =>
      semestersData?.semesters.find(
        semesterItem => semesterItem.id === parsedSemesterId,
      ),
    [parsedSemesterId, semestersData?.semesters],
  );

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

  if (isSemestersError) {
    return <NotFound />;
  }

  if (!isSemestersLoading && !semester) {
    return <NotFound />;
  }

  return (
    <AsyncBoundary isLoading={isSemestersLoading} isError={isSemestersError}>
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            { name: "지원금 신청 내역", path: "/executive/funding" },
          ]}
          title={`지원금 신청 내역 (${semester?.year}년 ${semester?.name}학기)`}
          enableLast
        />
        <ExecutiveFundingFrame semesterId={parsedSemesterId} />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveFundingSemester;
