"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { PrtTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { mockupMyPrint } from "@sparcs-clubs/web/features/my/services/_mock/mockMyClub";
import {
  formatDateTime,
  formatDateTimeEn,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import getPrintSize from "@sparcs-clubs/web/utils/getPrintSize";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

const columnHelper = createColumnHelper<(typeof mockupMyPrint.items)[number]>();

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
        size: 25,
      }),
      columnHelper.accessor("studentName", {
        id: "studentName",
        header: t("club"),
        cell: info => info.getValue(),
        size: 15,
      }),
      columnHelper.accessor("desiredPickUpDate", {
        id: "desiredPickUpDate",
        header: t("pickupAt"),
        cell: info =>
          locale === "en"
            ? formatDateTimeEn(info.getValue())
            : formatDateTime(info.getValue()),
        size: 25,
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
            .join(" "),
        size: 25,
      }),
    ],
    [locale, t],
  );
};

const MyPrintingBusiness = () => {
  const t = useTranslations("my.services");
  const data = useMemo(() => mockupMyPrint.items, []);

  const columns = useColumns();
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: t("myPage"), path: "/my" },
          { name: t("printing.title"), path: "/my/printing-business" },
        ]}
        title={t("printing.title")}
      />
      <FlexWrapper direction="row" gap={0} justify="flex-end">
        <Typography
          fw="REGULAR"
          fs={16}
          lh={20}
          ff="PRETENDARD"
          color="GRAY.600"
        >
          {t("total", { count: data.length })}
        </Typography>
      </FlexWrapper>
      <Table table={table} />
    </FlexWrapper>
  );
};

export default MyPrintingBusiness;
