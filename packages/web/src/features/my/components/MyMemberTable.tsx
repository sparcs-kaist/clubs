import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { ApiReg006ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg006";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  getDivisionTagColor,
  RegistrationStatusTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import {
  getTagColorFromClubType,
  getTagContentFromClubType,
} from "@sparcs-clubs/web/types/clubdetail.types";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface MyMemberTableProps {
  memberRegisterList: ApiReg006ResponseOk;
}

const columnHelper =
  createColumnHelper<ApiReg006ResponseOk["applies"][number]>();

const useColumns = () => {
  const t = useTranslations("my.overview");
  const clubT = useTranslations("club");
  const divisionT = useTranslations("division");
  return useMemo(
    () => [
      columnHelper.accessor("applyStatusEnumId", {
        id: "applyStatusEnumId",
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
      columnHelper.accessor("type", {
        id: "type",
        header: t("columns.type"),
        cell: info => (
          <Tag
            color={getTagColorFromClubType(
              info.row.original.type,
              info.row.original.isPermanent,
            )}
          >
            {clubT(
              getTagContentFromClubType(
                info.row.original.type,
                info.row.original.isPermanent,
              ),
            )}
          </Tag>
        ),
        size: 10,
      }),
      columnHelper.accessor("divisionName", {
        id: "divisionName",
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

      columnHelper.accessor("clubNameKr", {
        id: "clubNameKr",
        header: t("columns.club"),
        cell: info => info.getValue(),
        size: 128,
      }),
    ],
    [t, clubT, divisionT],
  );
};

const MyMemberTable: React.FC<MyMemberTableProps> = ({
  memberRegisterList,
}) => {
  const t = useTranslations("my.overview");
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: memberRegisterList.applies,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });
  const getRowLink = (row: ApiReg006ResponseOk["applies"][number]) => ({
    pathname: `/clubs/${row.clubId.toString()}`,
  });
  return (
    <Table
      table={table}
      rowLink={getRowLink}
      emptyMessage={t("noMemberRegistrations")}
    />
  );
};

export default MyMemberTable;
