"use client";

import { hangulIncludes } from "es-hangul";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
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
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import PastSemesterDashboardSection from "@sparcs-clubs/web/common/components/PastSemesterDashboardSection";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import useQueryCategories from "@sparcs-clubs/web/common/hooks/useQueryCategories";
import useQueryState from "@sparcs-clubs/web/common/hooks/useQueryState";
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

interface ExecutiveRegistrationClubFrameProps {
  url: string;
  semesterId?: number;
  showPastDashboard?: boolean;
}

export const ExecutiveRegistrationClubFrame: React.FC<
  ExecutiveRegistrationClubFrameProps
> = ({ url, semesterId, showPastDashboard = false }) => {
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useQueryState<number>("page", 1);
  const limit = 200;
  const [searchText, setSearchText] = useQueryState<string>(
    "query",
    "",
    "page",
  );

  const { data, isLoading, isError } = useGetRegisterClub({
    pageOffset: currentPage,
    itemCount: limit,
    ...(semesterId ? { semesterId } : {}),
  });

  const {
    data: divisionData,
    isLoading: divisionLoading,
    isError: divisionError,
  } = useGetDivisionType();

  const divisions = divisionData?.divisions;

  const DivisionNameList = useMemo(
    () => divisions?.map(item => item.name) ?? [],
    [divisions],
  );

  const [categories, setCategories] = useQueryCategories(
    [
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
        selectedContent: DivisionNameList,
      },
    ],
    ["registrationType", "division"],
    "page",
  );

  const convertedCategories = useMemo<ConvertedSelectedCategories[]>(() => {
    const convertedRegistrationType = categories[0].selectedContent.flatMap(
      item => getEnumRegistration(item),
    );

    const convertedDivisionId = (divisions ?? [])
      .filter(division => categories[1].selectedContent.includes(division.name))
      .map(division => division.id);

    return [
      {
        name: "등록 구분",
        selectedContent: convertedRegistrationType,
      },
      {
        name: "분과",
        selectedContent: convertedDivisionId,
      },
    ];
  }, [categories, divisions]);

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
              setCurrentPage(1);
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
                  selectedContent: DivisionNameList,
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
      {showPastDashboard && (
        <PastSemesterDashboardSection
          title="과거 동아리 등록 대시보드"
          emptyMessage="과거 동아리 등록 대시보드가 없습니다"
          semesters={data?.pastSemesters ?? []}
          rowLink={semester =>
            `/executive/register-club/semester/${semester.id}`
          }
        />
      )}
    </AsyncBoundary>
  );
};
