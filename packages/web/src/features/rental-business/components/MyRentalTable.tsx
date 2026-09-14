import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import type { ApiRnt003ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt003";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { RntTagList } from "@sparcs-clubs/web/constants/tableTagList";
import {
  formatDate,
  formatDateTime,
  formatDateTimeEn,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface RentalTableProps {
  rentalList: ApiRnt003ResponseOK;
  withCount?: boolean;
}

const columnHelper = createColumnHelper<ApiRnt003ResponseOK["items"][number]>();

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
          const { color } = getTagDetail(info.getValue(), RntTagList);
          return (
            <Tag color={color}>{t(`statuses.rental.${info.getValue()}`)}</Tag>
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
        size: 28,
      }),
      columnHelper.accessor("studentName", {
        id: "studentName",
        header: t("club"),
        cell: info => info.getValue(),
        size: 10,
      }),
      columnHelper.accessor("desiredStart", {
        id: "desiredStart",
        header: t("rental.start"),
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
        size: 21,
      }),
      columnHelper.accessor("desiredEnd", {
        id: "desiredEnd",
        header: t("rental.end"),
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
        size: 21,
      }),
      columnHelper.accessor(
        row =>
          t("rental.summary", {
            name: row.objects[0].name,
            count: row.objects[0].number,
            other: row.objects.length - 1,
          }),
        {
          id: "rentalObjects",
          header: t("rental.items"),
          cell: info => info.getValue(),
          size: 20,
        },
      ),
    ],
    [locale, t, formatter],
  );
};

const MyRentalTable: React.FC<RentalTableProps> = ({
  rentalList,
  withCount = false,
}) => {
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: rentalList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <Table table={table} count={withCount ? rentalList.total : undefined} />
  );
};

export default MyRentalTable;
