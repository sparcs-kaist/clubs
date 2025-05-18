"use client";

import React, { useEffect, useState } from "react";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Select from "@sparcs-clubs/web/common/components/Select";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import OverviewFrame from "@sparcs-clubs/web/features/overview/frames/OverviewFrame";

const Overview: React.FC = () => {
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

  const currentYear = new Date().getFullYear();
  const currentSemester = new Date().getMonth() < 6 ? "봄" : "가을";

  const [year, setYear] = useState<number>(currentYear);
  const [semesterName, setSemesterName] = useState<string>(currentSemester);

  const years = new Array(new Date().getFullYear() - 2022)
    .fill(2025)
    .map((y, i) => y - i);

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[{ name: "동아리 총람", path: "/overview" }]}
        title="동아리 총람"
      />
      <FlexWrapper direction="row" gap={12}>
        <Select
          value={year}
          items={years.map(y => ({
            label: `${y}`,
            value: y,
            selectable: true,
          }))}
          onChange={setYear}
        />
        <Select
          value={semesterName}
          items={[
            {
              label: "봄",
              value: "봄",
              selectable: true,
            },
            {
              label: "가을",
              value: "가을",
              selectable: true,
            },
          ]}
          onChange={setSemesterName}
        />
      </FlexWrapper>
      <OverviewFrame semesterName={semesterName} year={year} />
    </FlexWrapper>
  );
};

export default Overview;
