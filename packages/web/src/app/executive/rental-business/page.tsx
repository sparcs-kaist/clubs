"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { RentalOrderStatusEnum } from "@clubs/interface/common/enum/rental.enum";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { RntTagList } from "@sparcs-clubs/web/constants/tableTagList";
import mockupMyExeRnt from "@sparcs-clubs/web/features/rental-business/services/_mock/mockMyExeRnt";
import {
  formatDate,
  formatDateTime,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

const columnHelper =
  createColumnHelper<(typeof mockupMyExeRnt.items)[number]>();

const columns = [
  columnHelper.accessor("statusEnum", {
    id: "status",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), RntTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 10,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "신청 일시",
    cell: info => formatDateTime(info.getValue()),
    size: 20,
  }),
  columnHelper.accessor("studentName", {
    id: "studentName",
    header: "동아리",
    cell: info => info.getValue(),
    size: 10,
  }),
  columnHelper.accessor("applicantName", {
    id: "applicantName",
    header: "신청자",
    cell: info => info.getValue(),
    size: 10,
  }),
  columnHelper.accessor("phoneNumber", {
    id: "phoneNumber",
    header: "연락처",
    cell: info => info.getValue(),
    size: 10,
  }),
  columnHelper.accessor("desiredStart", {
    id: "desiredStart",
    header: "대여 일자",
    cell: info => formatDate(info.getValue()),
    size: 20,
  }),
  columnHelper.accessor("desiredEnd", {
    id: "desiredEnd",
    header: "반납 일자",
    cell: info => formatDate(info.getValue()),
    size: 20,
  }),
  columnHelper.accessor(
    row =>
      `${row.objects[0].name} ${row.objects[0].number}개 외 ${row.objects.length}항목`,
    {
      id: "rentalObjects",
      header: "대여 물품",
      cell: info => info.getValue(),
      size: 20,
    },
  ),
];

const TableWithPagination = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  align-self: stretch;
`;

const TableWithCount = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  align-self: stretch;
`;

interface RentalItems {
  id: number;
  name: string;
  number: number;
}

interface MockUpDataType {
  id: number;
  studentName: string;
  applicantName: string;
  phoneNumber: string;
  objects: Array<RentalItems>;
  statusEnum: RentalOrderStatusEnum;
  desiredStart: Date;
  desiredEnd: Date;
  startDate: Date;
  endTerm: Date;
  createdAt: Date;
}

const ExecutiveRental = () => {
  const [page, setPage] = useState<number>(1);
  const [mockUpData, setMockUpData] = useState<MockUpDataType[]>(
    mockupMyExeRnt.items.slice(0, 10),
  );
  useEffect(() => {
    setMockUpData(mockupMyExeRnt.items.slice((page - 1) * 10, page * 10));
  }, [page]);

  const data = useMemo(() => mockUpData, [mockUpData]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={20} justify="center">
      <FlexWrapper direction="column" gap={20}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            { name: "대여 사업 신청 내역", path: "/executive/rental-business" },
          ]}
          title="대여 사업 신청 내역"
        />
      </FlexWrapper>
      <TableWithPagination>
        <TableWithCount>
          {mockupMyExeRnt.items.slice((page - 1) * 10, page * 10).length && (
            <Table table={table} count={data.length} />
          )}
        </TableWithCount>
        <Pagination
          totalPage={Math.ceil(mockupMyExeRnt.items.length / 10)}
          currentPage={page}
          limit={10}
          setPage={setPage}
        />
      </TableWithPagination>
    </FlexWrapper>
  );
};

export default ExecutiveRental;
