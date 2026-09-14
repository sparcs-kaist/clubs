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
  RegistrationStatusTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

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
      columnHelper.accessor("registrationStatusEnumId", {
        id: "registrationStatusEnumId",
        header: t("columns.status"),
        cell: info => {
          const { color, text } = getTagDetail(
            info.getValue(),
            RegistrationStatusTagList,
          );
          return (
            <Tag color={color}>
              {t(
                `status.${({ 승인: "approved", 신청: "applied", 반려: "rejected" } as Record<string, string>)[text] ?? "unknown"}`,
              )}
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
