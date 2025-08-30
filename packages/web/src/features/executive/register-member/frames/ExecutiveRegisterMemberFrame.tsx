"use client";

import { hangulIncludes } from "es-hangul";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MultiFilter from "@sparcs-clubs/web/common/components/MultiFilter/Index";
import { CategoryProps } from "@sparcs-clubs/web/common/components/MultiFilter/types/FilterCategories";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import RegistrationMemberTable from "@sparcs-clubs/web/features/executive/register-member/components/RegisterMemberTable";
import { useGetMemberRegistration } from "@sparcs-clubs/web/features/executive/register-member/services/useGetMemberRegistration";

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

interface ConvertedSelectedCategories {
  name: string;
  selectedContent: (number | string)[];
}

export const ExecutiveRegisterMember: React.FC = () => {
  const t = useTranslations("club");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 200;

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

  const [searchText, setSearchText] = useState<string>("");

  const [categories, setCategories] = useState<CategoryProps[]>([
    {
      name: "구분",
      content: ["정동아리", "가동아리", "상임동아리"],
      selectedContent: ["정동아리", "가동아리", "상임동아리"],
    },
    {
      name: "분과",
      content: DivisionNameList,
      selectedContent: DivisionNameList,
    },
  ]);

  const [convertedCategories, setConvertedCategories] = useState<
    ConvertedSelectedCategories[]
  >([
    { name: "구분", selectedContent: [1, 2, 3] },
    { name: "분과", selectedContent: DivisionNameList },
  ]);

  useMemo(() => {
    const convertedClubType = categories[0].selectedContent.map(item => {
      if (item === "정동아리") return 1;
      if (item === "가동아리") return 2;
      if (item === "상임동아리") return 3;
      return 0;
    });

    const convertedDivisionNames = categories[1].selectedContent;

    setConvertedCategories([
      {
        name: "구분",
        selectedContent: convertedClubType,
      },
      {
        name: "분과",
        selectedContent: convertedDivisionNames,
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
        item.division.name,
      );

      return searchMatched && clubTypeMatched && divisionMatched;
    });

    return {
      total: rows.length,
      items: rows,
      offset: data.offset,
    };
  }, [data, searchText, convertedCategories]);

  useEffect(() => {
    if (categories[1].content.length === 0 && divisionData) {
      setCategories([
        ...categories.slice(0, 1),
        {
          name: "분과",
          content: DivisionNameList,
          selectedContent: DivisionNameList,
        },
      ]);
    }
  }, [categories, DivisionNameList, divisionData]);

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
                placeholder={t("placeholder")}
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
                      selectedContent: DivisionNameList,
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
                setPage={setCurrentPage}
              />
            </FlexWrapper>
          </TableWithPaginationWrapper>
        </>
      )}
    </AsyncBoundary>
  );
};
