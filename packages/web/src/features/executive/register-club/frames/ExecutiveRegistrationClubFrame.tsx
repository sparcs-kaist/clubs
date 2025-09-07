"use client";

import { hangulIncludes } from "es-hangul";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import {
  getDisplayNameRegistration,
  getEnumRegistration,
} from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import ExecutiveRegistrationTable from "@sparcs-clubs/web/common/components/ExecutiveRegistrationTable";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MultiFilter from "@sparcs-clubs/web/common/components/MultiFilter/Index";
import { CategoryProps } from "@sparcs-clubs/web/common/components/MultiFilter/types/FilterCategories";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import { RegistrationTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { useGetRegisterClub } from "@sparcs-clubs/web/features/executive/register-club/services/useGetRegisterClub";

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

const RegistrationTypeList = Object.keys(RegistrationTypeTagList).map(key =>
  parseInt(key),
);

export const ExecutiveRegistrationClubFrame: React.FC<{ url: string }> = ({
  url,
}) => {
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 200;
  const [searchText, setSearchText] = useState<string>("");

  const { data, isLoading, isError } = useGetRegisterClub({
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

  const [categories, setCategories] = useState<CategoryProps[]>([
    {
      name: "등록 구분",
      content: Array.from(
        new Set(
          RegistrationTypeList.map(item => getDisplayNameRegistration(item)),
        ),
      ),
      selectedContent: Array.from(
        new Set(
          RegistrationTypeList.map(item => getDisplayNameRegistration(item)),
        ),
      ),
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
      name: "등록 구분",
      selectedContent: RegistrationTypeList,
    },
    {
      name: "분과",
      selectedContent: divisionData?.divisions?.map(item => item.id) ?? [],
    },
  ]);

  useEffect(() => {
    const convertedRegistrationType = categories[0].selectedContent.flatMap(
      item => getEnumRegistration(item),
    );

    const convertedDivisionId = categories[1].selectedContent.map(item =>
      parseInt(item),
    );

    setConvertedCategories([
      {
        name: "등록 구분",
        selectedContent: convertedRegistrationType,
      },
      {
        name: "분과",
        selectedContent: convertedDivisionId,
      },
    ]);
  }, [categories]);

  const filterClubsWithSearch = useMemo(() => {
    const filteredRowsWithSearch = data?.items.filter(
      item =>
        ((item.clubNameKr ?? item.newClubNameKr)
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
          (item.clubNameEn ?? item.newClubNameEn)
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          hangulIncludes(item.newClubNameKr, searchText)) &&
        convertedCategories[0].selectedContent.includes(
          item.registrationTypeEnumId,
        ) &&
        convertedCategories[1].selectedContent.includes(item.divisionId),
    );

    return {
      total: filteredRowsWithSearch?.length ?? 0,
      items: filteredRowsWithSearch ?? [],
      offset: data?.offset ?? 0,
    };
  }, [searchText, convertedCategories, currentPage, data]);

  const filterClubsWithoutSearch = useMemo(() => {
    const filteredRowsWithoutSearch = data?.items.filter(
      item =>
        convertedCategories[0].selectedContent.includes(
          item.registrationTypeEnumId,
        ) && convertedCategories[1].selectedContent.includes(item.divisionId),
    );

    return {
      total: filteredRowsWithoutSearch?.length ?? 0,
      items: filteredRowsWithoutSearch ?? [],
      offset: data?.offset ?? 0,
    };
  }, [convertedCategories, currentPage, data]);

  const filteredClubs = useMemo(
    () =>
      searchText === "" ? filterClubsWithoutSearch : filterClubsWithSearch,
    [searchText, filterClubsWithoutSearch, filterClubsWithSearch],
  );

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
      <ClubSearchAndFilterWrapper>
        <ClubSearchAndFilter>
          <SearchInput
            searchText={searchText}
            handleChange={setSearchText}
            placeholder={t("club.placeholder")}
          />
          <MultiFilter categories={categories} setCategories={setCategories} />
        </ClubSearchAndFilter>
        <ResetSearchAndFilterWrapper>
          <TextButton
            text="검색/필터 초기화"
            onClick={() => {
              setSearchText("");
              setCategories([
                {
                  name: "등록 구분",
                  content: Array.from(
                    new Set(
                      RegistrationTypeList.map(item =>
                        getDisplayNameRegistration(item),
                      ),
                    ),
                  ),
                  selectedContent: Array.from(
                    new Set(
                      RegistrationTypeList.map(item =>
                        getDisplayNameRegistration(item),
                      ),
                    ),
                  ),
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
        <ExecutiveRegistrationTable
          registerList={filteredClubs ?? { total: 0, items: [], offset: 0 }}
          url={url}
        />
        <FlexWrapper direction="row" gap={16} justify="center">
          <Pagination
            totalPage={Math.ceil((data?.total ?? 0) / limit)}
            currentPage={currentPage}
            limit={limit}
            setPage={setCurrentPage}
          />
        </FlexWrapper>
      </TableWithPaginationWrapper>
    </AsyncBoundary>
  );
};
