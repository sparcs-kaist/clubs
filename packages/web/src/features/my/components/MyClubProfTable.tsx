import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { ApiReg021ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg021";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  getDivisionTagColor,
  ProfessorIsApprovedTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";

interface MyClubTableProps {
  clubProfRegisterList: ApiReg021ResponseOk;
}
const columnHelper = createColumnHelper<ApiReg021ResponseOk["items"][number]>();

const useColumns = () => {
  const t = useTranslations("my.overview");
  const clubT = useTranslations("club");
  const divisionT = useTranslations("division");
  const { isEnglish } = useLanguage();
  return useMemo(
    () => [
      columnHelper.accessor("professorSignedAt", {
        id: "professorSignedAt",
        header: t("columns.status"),
        cell: info => {
          const isApproved = Boolean(info.getValue());
          const { color } = ProfessorIsApprovedTagList(isApproved);
          return (
            <Tag color={color}>
              {t(isApproved ? "status.approved" : "status.pending")}
            </Tag>
          );
        },
        size: 10,
      }),
      columnHelper.accessor("division.name", {
        id: "division.name",
        header: clubT("분과"),
        cell: info => (
          <Tag color={getDivisionTagColor(info.getValue())}>
            {divisionT.has(info.getValue())
              ? divisionT(info.getValue())
              : info.getValue()}
          </Tag>
        ),
        size: 10,
      }),
      columnHelper.accessor(
        row =>
          (isEnglish ? row.clubNameEn || row.newClubNameEn : "") ||
          row.clubNameKr ||
          row.newClubNameKr,
        {
          id: "clubNameKr",
          header: t("columns.club"),
          cell: info => info.getValue(),
          size: 128,
        },
      ),
      columnHelper.accessor("student.studentNumber", {
        id: "student.studentNumber",
        header: t("columns.studentNumber"),
        cell: info => info.getValue(),
        size: 128,
      }),
      columnHelper.accessor("student.name", {
        id: "student.name",
        header: clubT("대표자"),
        cell: info => info.getValue(),
        size: 128,
      }),
      columnHelper.accessor("student.phoneNumber", {
        id: "student.phoneNumber",
        header: t("phoneNumber"),
        cell: info => info.getValue(),
        size: 128,
      }),
      columnHelper.accessor("student.email", {
        id: "student.email",
        header: t("columns.email"),
        cell: info => info.getValue(),
        size: 128,
      }),
    ],
    [t, clubT, divisionT, isEnglish],
  );
};

const MyClubProfTable: React.FC<MyClubTableProps> = ({
  clubProfRegisterList,
}) => {
  const t = useTranslations("my.overview");
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: clubProfRegisterList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });
  const getRowLink = (row: ApiReg021ResponseOk["items"][number]) => ({
    pathname: `/my/register-club/${row.id.toString()}`,
  });

  return (
    <Table
      table={table}
      rowLink={getRowLink}
      emptyMessage={t("noClubRegistrations")}
    />
  );
};
export default MyClubProfTable;
