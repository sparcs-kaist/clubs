import { ColumnFiltersState } from "@tanstack/react-table";
import { useEffect, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DetailFilterDropdown from "@sparcs-clubs/web/common/components/MultiFilter/_atomic/DetailFilterDropdown";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import ClubInfoKROverviewTable from "@sparcs-clubs/web/features/overview/components/ClubIntoKROverviewTable";
import DelegatesOverviewTable from "@sparcs-clubs/web/features/overview/components/DelegatesOverviewTable";
import useGetClubInfoKROverview from "@sparcs-clubs/web/features/overview/services/useGetClubInfoKROverview";
import useGetDelegatesOverview from "@sparcs-clubs/web/features/overview/services/useGetDelegatesOverview";

const divisions = [
  "생활문화",
  "종교",
  "사회",
  "연행예술",
  "전시창작",
  "밴드음악",
  "보컬음악",
  "구기체육",
  "생활체육",
  "이공학술",
  "인문학술",
];

const ExecutiveActivityReportFrame = () => {
  const [isDelegateView, setIsDelegateView] = useState<boolean>(
    window.history.state?.isDelegateView ?? true,
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "clubNameKr", value: "" },
    { id: "clubTypeEnum", value: ["정동아리", "가동아리"] },
    { id: "divisionName", value: divisions },
  ]);

  const delegates = useGetDelegatesOverview({
    division:
      "생활문화,종교,사회,연행예술,전시창작,밴드음악,보컬음악,구기체육,생활체육,이공학술,인문학술",
    hasDelegate1: false,
    hasDelegate2: false,
    provisional: true,
    regular: true,
    semesterName: "봄",
    year: 2024,
  });

  const clubInfo = useGetClubInfoKROverview({
    division:
      "생활문화,종교,사회,연행예술,전시창작,밴드음악,보컬음악,구기체육,생활체육,이공학술,인문학술",
    provisional: true,
    regular: true,
    semesterName: "봄",
    year: 2024,
  });

  useEffect(() => {
    window.history.replaceState({ isClubView: isDelegateView }, "");
  }, [isDelegateView]);

  return (
    <AsyncBoundary
      isLoading={delegates.isLoading || clubInfo.isLoading}
      isError={delegates.isError || clubInfo.isError}
    >
      <FlexWrapper direction="row" gap={12}>
        <Button
          style={{ flex: 1 }}
          type={isDelegateView ? "default" : "outlined"}
          onClick={() => setIsDelegateView(true)}
        >
          동아리 대표자대의원
        </Button>
        <Button
          style={{ flex: 1 }}
          type={isDelegateView ? "outlined" : "default"}
          onClick={() => setIsDelegateView(false)}
        >
          동아리 정보(KR)
        </Button>
      </FlexWrapper>
      <FlexWrapper direction="row" gap={16}>
        <SearchInput
          searchText={columnFilters[0].value as string}
          handleChange={value => {
            setColumnFilters([
              { id: "clubName", value },
              ...columnFilters.slice(1),
            ]);
          }}
          placeholder=""
        />
        <DetailFilterDropdown
          category={{
            name: "동아리 구분",
            content: ["정동아리", "가동아리"],
            selectedContent: columnFilters[1].value as string[],
          }}
          setSelectedContents={selectedContents => {
            setColumnFilters([
              columnFilters[0],
              { id: "clubTypeEnum", value: selectedContents },
              ...columnFilters.slice(2),
            ]);
          }}
        />
        <DetailFilterDropdown
          category={{
            name: "분과",
            content: divisions,
            selectedContent: columnFilters[2].value as string[],
          }}
          setSelectedContents={selectedContents => {
            setColumnFilters([
              ...columnFilters.slice(0, 2),
              { id: "divisionName", value: selectedContents },
              ...columnFilters.slice(3),
            ]);
          }}
        />
      </FlexWrapper>
      {isDelegateView ? (
        <DelegatesOverviewTable
          delegates={delegates.data ?? []}
          columnFilters={columnFilters}
        />
      ) : (
        <ClubInfoKROverviewTable
          clubInfos={clubInfo.data ?? []}
          columnFilters={columnFilters}
        />
      )}
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportFrame;
