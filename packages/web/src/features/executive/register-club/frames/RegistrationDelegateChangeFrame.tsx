"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { hangulIncludes } from "es-hangul";
import { useMemo, useState } from "react";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import { ApiClb019ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb019";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import Table from "@sparcs-clubs/web/common/components/Table";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";

import { useGetRegistrationDelegateChangeClubs } from "../services/useRegistrationDelegateChange";

type ClubRow = ApiClb019ResponseOk["clubs"][number];
const columnHelper = createColumnHelper<ClubRow>();
const columns = [
  columnHelper.accessor("type", {
    header: "구분",
    cell: info =>
      info.getValue() === ClubTypeEnum.Regular ? "정동아리" : "가동아리",
    size: 120,
  }),
  columnHelper.accessor("divisionName", { header: "분과", size: 160 }),
  columnHelper.accessor("nameKr", { header: "동아리", size: 240 }),
  columnHelper.accessor("representative", { header: "대표자", size: 160 }),
  columnHelper.accessor("hasRegistration", {
    header: "이번 학기 등록 서류",
    cell: info => (info.getValue() ? "제출" : "미제출"),
    size: 180,
  }),
];

const RegistrationDelegateChangeFrame = () => {
  const { data, isLoading, isError } = useGetRegistrationDelegateChangeClubs();
  const [searchText, setSearchText] = useState("");
  const clubs = useMemo(() => {
    const query = searchText.toLowerCase();
    return (data?.clubs ?? []).filter(
      club =>
        club.nameKr.toLowerCase().includes(query) ||
        club.nameEn.toLowerCase().includes(query) ||
        hangulIncludes(club.nameKr, searchText),
    );
  }, [data?.clubs, searchText]);
  const table = useReactTable({
    data: clubs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <Banner icon="warning">
        {data?.isChangeable
          ? "동아리 등록 기간에만 대표자·대의원을 변경하거나 대의원 임기를 종료할 수 있습니다.\n이번 학기 등록 서류를 제출한 동아리는 대의원 임기 종료만 가능합니다.\n변경 이력은 이전 학기 마지막 전날에 변경된 것으로 기록됩니다."
          : "현재 동아리 등록 기간이 아니므로 대표자·대의원을 변경할 수 없습니다."}
      </Banner>
      <SearchInput
        searchText={searchText}
        handleChange={setSearchText}
        placeholder="동아리 이름을 입력하세요"
      />
      <Table
        table={table}
        count={clubs.length}
        minWidth={860}
        rowLink={
          data?.isChangeable
            ? club => `/executive/register-club/delegate-change/${club.id}`
            : undefined
        }
        emptyMessage={
          data?.isChangeable
            ? "대표자·대의원을 변경할 수 있는 동아리가 없습니다."
            : "동아리 등록 기간에만 목록을 확인할 수 있습니다."
        }
      />
    </AsyncBoundary>
  );
};

export default RegistrationDelegateChangeFrame;
