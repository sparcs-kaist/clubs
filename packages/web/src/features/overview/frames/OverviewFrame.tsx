import { ColumnFiltersState } from "@tanstack/react-table";
import React, { useEffect, useState } from "react";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MultiFilter from "@sparcs-clubs/web/common/components/MultiFilter/Index";
import { CategoryProps } from "@sparcs-clubs/web/common/components/MultiFilter/types/FilterCategories";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import ClubInfoKROverviewTable from "@sparcs-clubs/web/features/overview/components/ClubIntoKROverviewTable";
import DelegatesOverviewTable from "@sparcs-clubs/web/features/overview/components/DelegatesOverviewTable";
import useGetClubInfoKROverview from "@sparcs-clubs/web/features/overview/services/useGetClubInfoKROverview";
import useGetDelegatesOverview from "@sparcs-clubs/web/features/overview/services/useGetDelegatesOverview";
import { downloadDelegateOverviewExcel } from "@sparcs-clubs/web/features/overview/utils/downloadOverviewExcel";
import { OverviewFilteredRow } from "@sparcs-clubs/web/features/overview/utils/OverviewCommonColumns";

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
interface OverviewFrameProps {
  year: number;
  semesterName: string;
}

function overviewFilter(columnFilters: ColumnFiltersState) {
  return (row: OverviewFilteredRow) =>
    row.clubNameKr.includes(columnFilters[0].value as string) &&
    (columnFilters[1].value as string[]).includes(
      {
        [ClubTypeEnum.Regular]: "정동아리",
        [ClubTypeEnum.Provisional]: "가동아리",
      }[row.clubTypeEnum as ClubTypeEnum],
    ) &&
    (columnFilters[2].value as string[]).includes(row.divisionName);
}

const OverviewFrame: React.FC<OverviewFrameProps> = ({
  year,
  semesterName,
}) => {
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
    semesterName,
    year,
  });

  const clubInfo = useGetClubInfoKROverview({
    division:
      "생활문화,종교,사회,연행예술,전시창작,밴드음악,보컬음악,구기체육,생활체육,이공학술,인문학술",
    provisional: true,
    regular: true,
    semesterName: "봄",
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
      content: divisions,
      selectedContent: columnFilters[2].value as string[],
    },
  ];

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
              { id: "clubNameKr", value },
              ...columnFilters.slice(1),
            ]);
          }}
          placeholder=""
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
