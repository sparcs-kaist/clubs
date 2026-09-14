import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import type { ApiAcf003ResponseOk } from "@clubs/interface/api/activity-certificate/endpoint/apiAcf003";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { AcfTagList } from "@sparcs-clubs/web/constants/tableTagList";
import {
  formatDateTime,
  formatDateTimeEn,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface AcfTableProps {
  certificateList: ApiAcf003ResponseOk;
}

const columnHelper = createColumnHelper<ApiAcf003ResponseOk["items"][number]>();

const useColumns = () => {
  const t = useTranslations("my.services");
  const locale = useLocale();
  return useMemo(
    () => [
      columnHelper.accessor("statusEnum", {
        id: "status",
        header: t("status"),
        cell: info => {
          const { color } = getTagDetail(info.getValue(), AcfTagList);
          return (
            <Tag color={color}>
              {t(`statuses.certificate.${info.getValue()}`)}
            </Tag>
          );
        },
        size: 10,
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: t("appliedAt"),
        cell: info =>
          locale === "en"
            ? formatDateTimeEn(new Date(info.getValue()))
            : formatDateTime(new Date(info.getValue())),
        size: 50,
      }),
      columnHelper.accessor("studentName", {
        id: "studentName",
        header: t("club"),
        cell: info => info.getValue(),
        size: 20,
      }),
      columnHelper.accessor("issuedNumber", {
        id: "issuedNumber",
        header: t("certificate.copies"),
        cell: info => t("copies", { count: info.getValue() }),
        size: 20,
      }),
    ],
    [locale, t],
  );
};

const MyActivityCertificateTable: React.FC<AcfTableProps> = ({
  certificateList,
}) => {
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: certificateList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} />;
};

export default MyActivityCertificateTable;
