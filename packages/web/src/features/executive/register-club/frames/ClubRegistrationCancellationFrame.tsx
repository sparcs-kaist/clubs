"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import Table from "@sparcs-clubs/web/common/components/Table";
import { useGetClubsList } from "@sparcs-clubs/web/features/clubs/services/useGetClubsList";

import ClubRegistrationCancellationButton from "../components/ClubRegistrationCancellationButton";
import getClubRegistrationCancellationRows, {
  ClubRegistrationCancellationRow,
} from "../utils/getClubRegistrationCancellationRows";

const columnHelper = createColumnHelper<ClubRegistrationCancellationRow>();
const columns = [
  columnHelper.accessor("type", {
    header: "구분",
    cell: info =>
      info.getValue() === ClubTypeEnum.Regular ? "정동아리" : "가동아리",
    size: 120,
  }),
  columnHelper.accessor("divisionName", {
    header: "분과",
    size: 140,
  }),
  columnHelper.accessor("nameKr", {
    header: "동아리",
    size: 220,
  }),
  columnHelper.accessor("representative", {
    header: "대표자",
    cell: info => info.getValue() ?? "-",
    size: 160,
  }),
  columnHelper.display({
    id: "actions",
    header: "관리",
    cell: ({ row }) => (
      <ClubRegistrationCancellationButton
        clubId={row.original.id}
        clubName={row.original.nameKr}
      />
    ),
    size: 160,
  }),
];

const ClubRegistrationCancellationFrame = () => {
  const { data, isLoading, isError } = useGetClubsList();
  const [searchText, setSearchText] = useState("");
  const clubs = useMemo(
    () =>
      getClubRegistrationCancellationRows(data?.divisions ?? [], searchText),
    [data?.divisions, searchText],
  );
  const table = useReactTable({
    data: clubs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <SearchInput
        searchText={searchText}
        handleChange={setSearchText}
        placeholder="동아리 이름을 입력하세요"
      />
      <Table
        table={table}
        count={clubs.length}
        minWidth={800}
        emptyMessage="등록을 무효 처리할 수 있는 동아리가 없습니다."
      />
    </AsyncBoundary>
  );
};

export default ClubRegistrationCancellationFrame;
