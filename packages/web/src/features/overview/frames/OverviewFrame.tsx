import { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import DropdownTreeSelect, { TreeNode } from "react-dropdown-tree-select";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";

import ClubInfoKROverviewTable from "../components/ClubIntoKROverviewTable";
import DelegatesOverviewTable from "../components/DelegatesOverviewTable";
import useGetClubInfoKROverview from "../services/useGetClubInfoKROverview";
import useGetDelegatesOverview from "../services/useGetDelegatesOverview";

const DivisionNode = (division: string): TreeNode => ({
  value: division,
  // label: <Tag color={getDivisionTagColor(division)}>{division}</Tag>,
  label: division,
});

const DistrictNode = (district: string, children: Array<string>): TreeNode => ({
  value: `_${district}`,
  // label: <Label>{district}</Label>,
  label: district,
  children: children.map(DivisionNode),
});

const nodes = [
  DistrictNode("생활문화", ["생활문화"]),
  DistrictNode("종교사회", ["종교", "사회"]),
  DistrictNode("예술", ["연행예술", "전시창작"]),
  DistrictNode("음악", ["밴드음악", "보컬음악", "여섯줄"]),
  DistrictNode("체육", ["구기체육", "생활체육"]),
  DistrictNode("학술", ["이공학술", "인문학술"]),
];

const OverviewFrame = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const checkedDivisions = [
    "생활문화",
    "종교",
    "사회",
    "연행예술",
    "전시창작",
    "밴드음악",
    "보컬음악",
    "여섯줄",
    "구기체육",
    "생활체육",
    "이공학술",
    "인문학술",
  ].join(",");

  const delegates = useGetDelegatesOverview({
    division: checkedDivisions,
    hasDelegate1: false,
    hasDelegate2: false,
    provisional: true,
    regular: true,
    semesterName: "봄",
    year: 2024,
  });

  const clubInfo = useGetClubInfoKROverview({
    division: checkedDivisions,
    provisional: true,
    regular: true,
    semesterName: "봄",
    year: 2024,
  });

  const isDelegatesOverview = true;
  const setIsDelegatesOverview = (_: boolean) => {};

  return (
    <AsyncBoundary
      isLoading={delegates.isLoading && clubInfo.isLoading}
      isError={delegates.isError || clubInfo.isError}
    >
      <FlexWrapper direction="row" gap={12}>
        <Button
          style={{ flex: 1 }}
          type={isDelegatesOverview ? "default" : "outlined"}
          onClick={() => setIsDelegatesOverview(true)}
        >
          동아리 대표자대의원
        </Button>
        <Button
          style={{ flex: 1 }}
          type={isDelegatesOverview ? "outlined" : "default"}
          onClick={() => setIsDelegatesOverview(false)}
        >
          동아리 정보(KR)
        </Button>
      </FlexWrapper>
      <FlexWrapper direction="row" gap={16}>
        <SearchInput
          searchText={searchText}
          handleChange={setSearchText}
          placeholder=""
        />
        <DropdownTreeSelect
          data={nodes}
          onChange={(_, _divisions) => {
            setColumnFilters([]);
          }}
          inlineSearchInput
        />
      </FlexWrapper>
      <DelegatesOverviewTable
        delegates={delegates.data ?? []}
        columnFilters={columnFilters}
        // searchText={searchText}
        // divisions={checkedDivisions}
      />
      <ClubInfoKROverviewTable
        clubs={clubInfo.data ?? []}
        columnFilters={columnFilters}
        // searchText={searchText}
        // divisions={checkedDivisions}
      />
    </AsyncBoundary>
  );
};

export default OverviewFrame;
