import { ColumnFiltersState } from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MultiFilter from "@sparcs-clubs/web/common/components/MultiFilter/Index";
import { CategoryProps } from "@sparcs-clubs/web/common/components/MultiFilter/types/FilterCategories";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useGetDivisions from "@sparcs-clubs/web/common/services/getDivisions";
import { ClubTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { OverviewFilteredRow } from "@sparcs-clubs/web/features/overview/_atomic/OverviewCommonColumns";
import ClubInfoKROverviewTable from "@sparcs-clubs/web/features/overview/components/ClubIntoKROverviewTable";
import DelegatesOverviewTable from "@sparcs-clubs/web/features/overview/components/DelegatesOverviewTable";
import useGetClubInfoKROverview from "@sparcs-clubs/web/features/overview/services/useGetClubInfoKROverview";
import useGetDelegatesOverview from "@sparcs-clubs/web/features/overview/services/useGetDelegatesOverview";
import { downloadDelegateOverviewExcel } from "@sparcs-clubs/web/features/overview/utils/downloadOverviewExcel";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface OverviewFrameProps {
  year: number;
  semesterName: string;
}

// 이거 없으면 (division 요청한 뒤에 총람 요청 응답까지) 너무 느려서 넣었습니다.
const temporaryDivisions = [
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
  "연주음악",
  "식생활",
  "대중문화",
];

const getOverviewDivisionNames = (divisions: { name: string }[] | undefined) =>
  Array.from(
    new Set(
      [
        ...(divisions?.map(division => division.name) ?? []),
        ...temporaryDivisions,
      ]
        .map(name => name.trim())
        .filter(Boolean),
    ),
  );

function overviewFilter(columnFilters: ColumnFiltersState) {
  return (row: OverviewFilteredRow) =>
    row.clubNameKr.includes(columnFilters[0].value as string) &&
    (columnFilters[1].value as string[]).includes(
      getTagDetail(row.clubTypeEnum, ClubTypeTagList).text,
    ) &&
    (columnFilters[2].value as string[]).includes(row.divisionName);
}

const OverviewFrame: React.FC<OverviewFrameProps> = ({
  year,
  semesterName,
}) => {
  const { data: divisionData, isLoading, isError } = useGetDivisions();
  const overviewDivisionNames = useMemo(
    () => getOverviewDivisionNames(divisionData?.divisions),
    [divisionData?.divisions],
  );

  const [isDelegateView, setIsDelegateView] = useState<boolean>(
    window.history.state?.isDelegateView ?? true,
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "clubNameKr", value: "" },
    { id: "clubTypeEnum", value: ["정동아리", "가동아리"] },
    {
      id: "divisionName",
      value: overviewDivisionNames,
    },
  ]);

  const delegates = useGetDelegatesOverview({
    division: overviewDivisionNames.join(","),
    hasDelegate1: false,
    hasDelegate2: false,
    provisional: true,
    regular: true,
    semesterName,
    year,
  });

  const clubInfo = useGetClubInfoKROverview({
    division: overviewDivisionNames.join(","),
    provisional: true,
    regular: true,
    semesterName,
    year,
  });

  useEffect(() => {
    window.history.replaceState({ isClubView: isDelegateView }, "");
  }, [isDelegateView]);

  const getFilterCategories = () => [
    {
      name: "동아리 구분",
      content: ["정동아리", "가동아리"],
      selectedContent: columnFilters[1].value as string[],
    },
    {
      name: "분과",
      content: overviewDivisionNames,
      selectedContent: columnFilters[2].value as string[],
    },
  ];

  return (
    <AsyncBoundary
      isLoading={delegates.isLoading || clubInfo.isLoading || isLoading}
      isError={delegates.isError || clubInfo.isError || isError}
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
              { id: "clubNameKr", value },
              ...columnFilters.slice(1),
            ]);
          }}
          placeholder="동아리 이름을 입력하세요"
        />
        <MultiFilter
          categories={getFilterCategories()}
          setCategories={updated => {
            const categories = (
              updated as (prevState: CategoryProps[]) => CategoryProps[]
            )(getFilterCategories());
            setColumnFilters([
              columnFilters[0],
              { id: "clubTypeEnum", value: categories[0].selectedContent },
              { id: "divisionName", value: categories[1].selectedContent },
              ...columnFilters.slice(3),
            ]);
          }}
        />
        <Button
          onClick={() =>
            downloadDelegateOverviewExcel(
              {
                delegates: delegates.data?.filter(
                  overviewFilter(columnFilters),
                ),
                clubInfo: clubInfo.data?.filter(overviewFilter(columnFilters)),
              },
              year,
              semesterName,
            )
          }
          type={
            delegates.isLoading || clubInfo.isLoading ? "disabled" : "default"
          }
        >
          XLSX 다운로드
        </Button>
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

export default OverviewFrame;
