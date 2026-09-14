import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import type { ApiCms006ResponseOk } from "@clubs/interface/api/common-space/endpoint/apiCms006";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { CmsTagList } from "@sparcs-clubs/web/constants/tableTagList";
import {
  formatDate,
  formatDateTime,
  formatDateTimeEn,
  formatTime,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface CommonSpaceTableProps {
  spaceList: ApiCms006ResponseOk;
}

const columnHelper = createColumnHelper<ApiCms006ResponseOk["items"][number]>();

const useColumns = () => {
  const t = useTranslations("my.services");
  const locale = useLocale();
  const formatter = useFormatter();
  return useMemo(
    () => [
      columnHelper.accessor("statusEnum", {
        id: "status",
        header: t("status"),
        cell: info => {
          const { color } = getTagDetail(info.getValue(), CmsTagList);
          return (
            <Tag color={color}>
              {t(`statuses.commonSpace.${info.getValue()}`)}
            </Tag>
          );
        },
        size: 0,
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: t("appliedAt"),
        cell: info =>
          locale === "en"
            ? formatDateTimeEn(info.getValue())
            : formatDateTime(info.getValue()),
        size: 27,
      }),
      columnHelper.accessor("chargeStudentName", {
        id: "chargeStudentName",
        header: t("club"),
        cell: info => info.getValue(),
        size: 10,
      }),
      columnHelper.accessor("startTerm", {
        id: "startTerm",
        header: t("commonSpace.date"),
        cell: info =>
          locale === "en"
            ? formatter.dateTime(new Date(info.getValue()), {
                year: "numeric",
                month: "short",
                day: "numeric",
                weekday: "short",
                timeZone: "Asia/Seoul",
              })
            : formatDate(info.getValue()),
        size: 22,
      }),
      columnHelper.accessor(
        row => `${formatTime(row.startTerm)} ~ ${formatTime(row.endTerm)}`,
        {
          id: "time-range",
          header: t("commonSpace.time"),
          cell: info => info.getValue(),
          size: 15,
        },
      ),
      columnHelper.accessor("spaceName", {
        id: "spaceName",
        header: t("commonSpace.room"),
        cell: info => info.getValue(),
        size: 26,
      }),
    ],
    [locale, t, formatter],
  );
};

const MyCommonSpaceTable: React.FC<CommonSpaceTableProps> = ({ spaceList }) => {
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: spaceList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} />;
};

export default MyCommonSpaceTable;
