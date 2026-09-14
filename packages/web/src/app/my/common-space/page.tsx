"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { CmsTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { mockupMyCms } from "@sparcs-clubs/web/features/my/services/_mock/mockMyClub";
import {
  formatDate,
  formatDateTime,
  formatDateTimeEn,
  formatTime,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

const columnHelper = createColumnHelper<(typeof mockupMyCms.items)[number]>();

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
        size: 10,
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: t("appliedAt"),
        cell: info =>
          locale === "en"
            ? formatDateTimeEn(info.getValue())
            : formatDateTime(info.getValue()),
        size: 20,
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
        size: 16,
      }),
      columnHelper.accessor(
        row => `${formatTime(row.startTerm)} ~ ${formatTime(row.endTerm)}`,
        {
          id: "time-range",
          header: t("commonSpace.time"),
          cell: info => info.getValue(),
          size: 16,
        },
      ),
      columnHelper.accessor("spaceName", {
        id: "spaceName",
        header: t("commonSpace.room"),
        cell: info => info.getValue(),
        size: 28,
      }),
    ],
    [locale, t, formatter],
  );
};

const MyCommonSpace = () => {
  const t = useTranslations("my.services");
  const data = useMemo(() => mockupMyCms.items, []);

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
          { name: t("commonSpace.title"), path: "/my/common-space" },
        ]}
        title={t("commonSpace.title")}
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

export default MyCommonSpace;
