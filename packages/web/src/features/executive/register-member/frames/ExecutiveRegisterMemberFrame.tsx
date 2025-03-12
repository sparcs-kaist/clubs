"use client";

import { hangulIncludes } from "es-hangul";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MultiFilter from "@sparcs-clubs/web/common/components/MultiFilter/Index";
import { CategoryProps } from "@sparcs-clubs/web/common/components/MultiFilter/types/FilterCategories";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import RegistrationMemberTable from "@sparcs-clubs/web/common/components/RegisterMemberTable";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import { useGetMemberRegistration } from "@sparcs-clubs/web/features/executive/register-member/services/getMemberRegistration";

interface ConvertedSelectedCategories {
  name: string;
  selectedContent: number[];
}

const ClubSearchAndFilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const ClubSearchAndFilter = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const ResetSearchAndFilterWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  align-self: stretch;
`;

const TableWithPaginationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  align-self: stretch;
`;

export const ExecutiveRegisterMember = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 10;
  const { data, isLoading, isError } = useGetMemberRegistration({
    pageOffset: currentPage,
    itemCount: limit,
  });

  const {
    data: divisionData,
    isLoading: divisionLoading,
    isError: divisionError,
  } = useGetDivisionType();

  const DivisionNameList = useMemo(
    () => divisionData?.divisions?.map(item => item.name) ?? [],
    [divisionData],
  );

  const DivisionIdList = useMemo(
    () => divisionData?.divisions?.map(item => item.id.toString()) ?? [],
    [divisionData],
  );

  const [searchText, setSearchText] = useState<string>("");

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /*
    동아리 구분에 대해서만 hardcoding  
    정동아리, 가동아리만 club.enum에 존재하고, 상임동아리(3)는 필터링을 위해 편의상 설정한 것이기 때문
  */
  const [categories, setCategories] = useState<CategoryProps[]>([
    {
      name: "구분",
      content: ["정동아리", "가동아리", "상임동아리"],
      selectedContent: ["정동아리", "가동아리", "상임동아리"],
    },
    {
      name: "분과",
      content: DivisionNameList,
      selectedContent: DivisionIdList,
    },
  ]);

  const [convertedCategories, setConvertedCategories] = useState<
    ConvertedSelectedCategories[]
  >([
    {
      name: "구분",
      selectedContent: [1, 2, 3],
    },
    {
      name: "분과",
      selectedContent: DivisionIdList.map(item => parseInt(item)),
    },
  ]);

  useMemo(() => {
    const convertedClubType = categories[0].selectedContent.map(item => {
      switch (item) {
        case "정동아리":
          return 1;
        case "가동아리":
          return 2;
        case "상임동아리":
          return 3;
        default:
          return 0;
      }
    });

    const convertedDivisionId = categories[1].selectedContent.map(item =>
      parseInt(item),
    );

    setConvertedCategories([
      {
        name: "구분",
        selectedContent: convertedClubType,
      },
      {
        name: "분과",
        selectedContent: convertedDivisionId,
      },
    ]);
  }, [categories]);

  const filteredClubs = useMemo(() => {
    if (!data) {
      return { total: 0, items: [], offset: 0 };
    }

    const rows = data.items.filter(item => {
      const searchMatched =
        searchText === "" ||
        item.clubName.toLowerCase().includes(searchText.toLowerCase()) ||
        hangulIncludes(item.clubName, searchText);

      const clubTypeMatched = item.isPermanent
        ? convertedCategories[0].selectedContent.includes(3)
        : convertedCategories[0].selectedContent.includes(item.clubTypeEnumId);

      const divisionMatched = convertedCategories[1].selectedContent.includes(
        item.division.id,
      );

      return searchMatched && clubTypeMatched && divisionMatched;
    });

    return {
      total: rows.length,
      items: rows,
      offset: data.offset,
    };
  }, [data, searchText, convertedCategories, currentPage]);

  useEffect(() => {
    if (categories[1].content.length === 0 && divisionData) {
      setCategories([
        ...categories.slice(0, 1),
        {
          name: "분과",
          content: DivisionNameList,
          selectedContent: DivisionIdList,
        },
      ]);
    }
  }, [categories, DivisionIdList, DivisionNameList]);

  return (
    <AsyncBoundary
      isLoading={isLoading || divisionLoading}
      isError={isError || divisionError}
    >
      {data && filteredClubs && (
        <>
          <ClubSearchAndFilterWrapper>
            <ClubSearchAndFilter>
              <SearchInput
                searchText={searchText}
                handleChange={setSearchText}
                placeholder="동아리 이름으로 검색하세요"
              />
              <MultiFilter
                categories={categories}
                setCategories={setCategories}
              />
            </ClubSearchAndFilter>
            <ResetSearchAndFilterWrapper>
              <TextButton
                text="검색/필터 초기화"
                onClick={() => {
                  setSearchText("");
                  setCategories([
                    {
                      name: "구분",
                      content: ["정동아리", "가동아리", "상임동아리"],
                      selectedContent: ["정동아리", "가동아리", "상임동아리"],
                    },
                    {
                      name: "분과",
                      content: DivisionNameList,
                      selectedContent: DivisionIdList,
                    },
                  ]);
                }}
              />
            </ResetSearchAndFilterWrapper>
          </ClubSearchAndFilterWrapper>
          <TableWithPaginationWrapper>
            <RegistrationMemberTable registerMemberList={filteredClubs} />
            <FlexWrapper direction="row" gap={16} justify="center">
              <Pagination
                totalPage={Math.ceil(data.total / limit)}
                currentPage={currentPage}
                limit={limit}
                setPage={handlePageChange}
              />
            </FlexWrapper>
          </TableWithPaginationWrapper>
        </>
      )}
    </AsyncBoundary>
  );
};
