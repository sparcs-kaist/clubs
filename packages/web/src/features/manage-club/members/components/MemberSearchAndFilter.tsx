import React from "react";
import styled from "styled-components";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import SemesterFilter from "@sparcs-clubs/web/common/components/SemesterFilter/index";

import { SemesterListProps } from "../types/semesterList";

const SearchAndFilterWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    flex-direction: column;
    align-items: flex-end;
  }
`;

const ResetButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-end;
`;

const MemberSearchAndFilter: React.FC<
  SemesterListProps & {
    searchText: string;
    handleChange: (value: string) => void;
  }
> = ({
  semesters,
  selectedSemesters,
  setSelectedSemesters,
  searchText,
  handleChange,
}) => {
  const handleReset = () => {
    setSelectedSemesters(semesters);
    handleChange("");
  };
  return (
    <FlexWrapper direction="column" gap={20}>
      <SearchAndFilterWrapper>
        <div style={{ width: "100%" }}>
          <SearchInput searchText={searchText} handleChange={handleChange} />
        </div>
        <SemesterFilter
          semesters={semesters}
          selectedSemesters={selectedSemesters}
          setSelectedSemesters={setSelectedSemesters}
        />
      </SearchAndFilterWrapper>
      <ResetButtonWrapper>
        <TextButton
          text="검색/필터 초기화"
          onClick={handleReset}
          disabled={semesters === selectedSemesters && searchText === ""}
        />
      </ResetButtonWrapper>
    </FlexWrapper>
  );
};

export default MemberSearchAndFilter;
