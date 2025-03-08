// import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ApiReg020ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg020";

// import styled from "styled-components";
// import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
// import Typography from "@sparcs-clubs/web/common/components/Typography";
import { MemTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface RegisterInfoTableProps {
  memberRegisterInfoList: ApiReg020ResponseOk;
}

// const ToggleWrapper = styled.div`
//   gap: 12px;
//   justify-content: center;
//   align-items: center;
//   direction: row;
//   display: flex;
// `;
const columnHelper = createColumnHelper<ApiReg020ResponseOk["items"][number]>();

const columns = [
  columnHelper.accessor("RegistrationApplicationStudentStatusEnumId", {
    id: "registrationStatus",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), MemTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 90,
  }),
  columnHelper.accessor("isRegularMemberRegistration", {
    id: "isRegularMemberRegistration",
    header: "구분",
    cell: info => {
      if (info.row.original.student.studentNumber % 10000 < 2000)
        return <Tag color="BLUE">정회원</Tag>;
      if (info.row.original.student.studentNumber % 10000 < 6000)
        return <Tag color="GRAY">준회원</Tag>;
      if (info.row.original.student.studentNumber % 10000 < 7000)
        return <Tag color="BLUE">정회원</Tag>;
      return <Tag color="GRAY">준회원</Tag>;

      // if (info.getValue()) return <Tag color="BLUE">정회원</Tag>;
      // return <Tag color="GRAY">준회원</Tag>;
    },
    size: 220,
  }),
  columnHelper.accessor("student.studentNumber", {
    id: "student.studentNumber",
    header: "학번",
    cell: info => info.getValue(),
    size: 100,
  }),
  columnHelper.accessor("student.name", {
    id: "student.name",
    header: "신청자",
    cell: info => info.getValue(),
    size: 120,
  }),
  columnHelper.accessor("student.phoneNumber", {
    id: "student.phoneNumber",
    header: "전화번호",
    cell: info => info.getValue(),
    size: 160,
  }),
  columnHelper.accessor("student.email", {
    id: "student.email",
    header: "이메일",
    cell: info => info.getValue(),
    size: 240,
  }),
  /** NOTE: (@dora)
   * - 집행부원이 회원 등록 신청을 승인 / 반려하는 API가 존재하지 않음
   * - 당장 필요하지 않다고 하여
   * 해당 코드 일단 추석 처리합니다
   */
  // columnHelper.accessor("RegistrationApplicationStudentStatusEnumId", {
  //   id: "RegistrationApplicationStudentStatusEnumId",
  //   header: "비고",
  //   cell: info => {
  //     if (
  //       info.row.original.RegistrationApplicationStudentStatusEnumId ===
  //       RegistrationApplicationStudentStatusEnum.Approved
  //     ) {
  //       return (
  //         <ToggleWrapper>
  //           <TextButton text="승인" disabled />
  //           <Typography>/</Typography>
  //           <TextButton text="반려" />
  //         </ToggleWrapper>
  //       );
  //     }
  //     if (
  //       info.row.original.RegistrationApplicationStudentStatusEnumId ===
  //       RegistrationApplicationStudentStatusEnum.Pending
  //     ) {
  //       return (
  //         <ToggleWrapper>
  //           <TextButton text="승인" />
  //           <Typography>/</Typography>
  //           <TextButton text="반려" />
  //         </ToggleWrapper>
  //       );
  //     }
  //     return (
  //       <ToggleWrapper>
  //         <TextButton text="승인" />
  //         <Typography>/</Typography>
  //         <TextButton text="반려" disabled />
  //       </ToggleWrapper>
  //     );
  //   },
  //   size: 290,
  // }),
];

const RegisterInfoTable: React.FC<RegisterInfoTableProps> = ({
  memberRegisterInfoList: mrInfoList,
}) => {
  const table = useReactTable({
    columns,
    data: mrInfoList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} count={mrInfoList.total} />;
};

export default RegisterInfoTable;
