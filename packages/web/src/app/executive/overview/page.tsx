"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { ApiSem001ResponseOK } from "@clubs/interface/api/semester/apiSem001";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import OverviewFrame from "@sparcs-clubs/web/features/overview/frames/OverviewFrame";
import { isOverviewSelectableSemester } from "@sparcs-clubs/web/features/overview/utils/overviewSemester";
import {
  formatDotDate,
  formatDotDetailDate,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

type Semester = ApiSem001ResponseOK["semesters"][number];

const CriteriaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.GRAY[100]};
`;

function toDate(date: Date | string) {
  return date instanceof Date ? date : new Date(date);
}

function getDelegateCriteriaDate(semester: Semester) {
  const now = new Date();
  const startTerm = toDate(semester.startTerm);
  const endTerm = toDate(semester.endTerm);

  if (now < startTerm) {
    return startTerm;
  }

  if (endTerm < now) {
    return endTerm;
  }

  return now;
}

const ExecutiveOverview = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const { semester: semesterInfo, isLoading: isSemesterNowLoading } =
    useGetSemesterNow();
  const {
    data: semestersData,
    isLoading: isSemestersLoading,
    isError: isSemestersError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });
  const [selectedSemesterId, setSelectedSemesterId] = useState<
    number | undefined
  >(undefined);

  const semesters = useMemo(
    () => (semestersData?.semesters ?? []).filter(isOverviewSelectableSemester),
    [semestersData?.semesters],
  );

  useEffect(() => {
    if (semesters.length === 0) {
      return;
    }

    if (
      selectedSemesterId !== undefined &&
      semesters.some(semester => semester.id === selectedSemesterId)
    ) {
      return;
    }

    const currentSemester = semesterInfo
      ? semesters.find(semester => semester.id === semesterInfo.id)
      : undefined;

    setSelectedSemesterId((currentSemester ?? semesters[0]).id);
  }, [semesterInfo, semesters, selectedSemesterId]);

  const selectedSemester = semesters.find(
    semester => semester.id === selectedSemesterId,
  );

  const isAuthLoading =
    isLoggedIn === undefined || (isLoggedIn && profile === undefined);

  if (isAuthLoading || isSemesterNowLoading || isSemestersLoading) {
    return <AsyncBoundary isLoading isError={false} />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile?.type !== UserTypeEnum.Executive) {
    return <NotFound />;
  }

  if (isSemestersError || !selectedSemester) {
    return <AsyncBoundary isLoading={false} isError />;
  }

  const criteriaDate = getDelegateCriteriaDate(selectedSemester);
  const semesterStartTerm = toDate(selectedSemester.startTerm);
  const semesterEndTerm = toDate(selectedSemester.endTerm);

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "동아리 총람", path: "/executive/overview" },
        ]}
        title="동아리 총람"
      />
      <FlexWrapper direction="row" gap={12}>
        <Select
          label="학기"
          value={selectedSemesterId}
          items={semesters.map(semester => ({
            label: `${semester.year} ${semester.name}`,
            value: semester.id,
            selectable: true,
          }))}
          onChange={setSelectedSemesterId}
        />
      </FlexWrapper>
      <CriteriaInfo>
        <Typography fs={14} lh={20} fw="MEDIUM">
          대표자/대의원 기준일시: {formatDotDetailDate(criteriaDate)}
        </Typography>
        <Typography fs={14} lh={20} color="GRAY.600">
          학기 기간: {formatDotDate(semesterStartTerm)} ~{" "}
          {formatDotDate(semesterEndTerm)}
        </Typography>
      </CriteriaInfo>
      <OverviewFrame
        semesterName={selectedSemester.name}
        year={selectedSemester.year}
      />
    </FlexWrapper>
  );
};

export default ExecutiveOverview;
