import React, { useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";

import useGetExecutiveClubActivities from "../services/useGetExecutiveClubActivities";

const ExecutiveActivityReportClubFrame: React.FC<{ clubId: string }> = ({
  clubId,
}) => {
  const [searchText, setSearchText] = useState<string>("");
  const { data, isLoading, isError } = useGetExecutiveClubActivities({
    clubId: Number(clubId),
  });

  // const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]);
  console.log(data);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {/* <ActivityReportClubStatistic activities={data ?? { items: [] }} /> */}
      <FlexWrapper direction="row" gap={16}>
        <SearchInput
          searchText={searchText}
          handleChange={setSearchText}
          placeholder=""
        />
        <Button>담당자 변경</Button>
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportClubFrame;
