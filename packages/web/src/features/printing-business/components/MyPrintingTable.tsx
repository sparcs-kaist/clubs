import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import type { ApiPrt001ResponseOk } from "@clubs/interface/api/promotional-printing/endpoint/apiPrt001";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { PrtTagList } from "@sparcs-clubs/web/constants/tableTagList";
import {
  formatDateTime,
  formatDateTimeEn,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import getPrintSize from "@sparcs-clubs/web/utils/getPrintSize";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface PrintingTableProps {
  printingList: ApiPrt001ResponseOk;
}

const columnHelper = createColumnHelper<ApiPrt001ResponseOk["items"][number]>();

const useColumns = () => {
  const t = useTranslations("my.services");
  const locale = useLocale();
  return useMemo(
    () => [
      columnHelper.accessor("status", {
        id: "status",
        header: t("status"),
        cell: info => {
          const { color } = getTagDetail(info.getValue(), PrtTagList);
          return (
            <Tag color={color}>{t(`statuses.printing.${info.getValue()}`)}</Tag>
          );
        },
        size: 10,
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: t("appliedAt"),
        cell: info =>
          locale === "en"
            ? formatDateTimeEn(info.getValue())
            : formatDateTime(info.getValue()),
        size: 24,
      }),
      columnHelper.accessor("studentName", {
        id: "studentName",
        header: t("club"),
        cell: info => info.getValue(),
        size: 18,
      }),
      columnHelper.accessor("desiredPickUpDate", {
        id: "desiredPickUpDate",
        header: t("pickupAt"),
        cell: info =>
          locale === "en"
            ? formatDateTimeEn(info.getValue())
            : formatDateTime(info.getValue()),
        size: 24,
      }),
      columnHelper.accessor("orders", {
        id: "orders",
        header: t("printing.copies"),
        cell: info =>
          info
            .getValue()
            .sort(
              (a, b) =>
                b.promotionalPrintingSizeEnum - a.promotionalPrintingSizeEnum,
            )
            .map(order =>
              t("printing.order", {
                size: getPrintSize(order.promotionalPrintingSizeEnum),
                count: order.numberOfPrints,
              }),
            )
            .join(", "),
        size: 24,
      }),
    ],
    [locale, t],
  );
};

const MyPrintingTable: React.FC<PrintingTableProps> = ({ printingList }) => {
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: printingList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} />;
};

export default MyPrintingTable;
