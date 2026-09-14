import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import { ApiAct011ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct011";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { ActStatusTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { ActivityReport } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import { getActivityTypeTagColor } from "@sparcs-clubs/web/types/activityType";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import PastActivityReportModal from "./PastActivityReportModal";

interface ActivityReportListProps {
  data: ActivityReport[];
  profile: string;
  refetch?: () => void;
  clubId: number;
}

const columnHelper =
  createColumnHelper<ApiAct011ResponseOk["activities"][number]>();

const TableOuter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 8px;
  align-self: stretch;
`;

const getColumns = (
  t: ReturnType<typeof useTranslations<"my.registration.activity">>,
  format: ReturnType<typeof useFormatter>,
) => [
  columnHelper.accessor("activityStatusEnumId", {
    id: "activityStatusEnumId",
    header: t("statusLabel"),
    cell: info => {
      const { color } = getTagDetail(info.getValue(), ActStatusTagList);
      return <Tag color={color}>{t(`status.${info.getValue()}`)}</Tag>;
    },
    size: 64,
  }),
  columnHelper.accessor("name", {
    header: t("name"),
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    header: t("type"),
    cell: info => (
      <Tag color={getActivityTypeTagColor(info.getValue())}>
        {t(`types.${info.getValue()}`)}
      </Tag>
    ),
    size: 128,
  }),
  columnHelper.accessor(
    row =>
      `${format.dateTime(new Date(row.durations[0].startTerm), { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })} ~ ${format.dateTime(new Date(row.durations[0].endTerm), { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}${row.durations.length > 1 ? t("additionalPeriods", { count: row.durations.length - 1 }) : ""}`,
    {
      header: t("period"),
      cell: info => info.getValue(),
      size: 255,
    },
  ),
];

const ActivityReportList: React.FC<ActivityReportListProps> = ({
  data,
  profile,
  refetch = () => {},
  clubId,
}) => {
  const t = useTranslations("my.registration.activity");
  const format = useFormatter();
  const columns = useMemo(() => getColumns(t, format), [format, t]);
  const processedData = useMemo(
    () =>
      data.map(item => ({
        ...item,
        durations: item.durations.map(duration => ({
          startTerm: duration.startTerm!,
          endTerm: duration.endTerm!,
        })),
      })),
    [data],
  );

  const table = useReactTable({
    columns,
    data: processedData,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const openPastActivityReportModal = useCallback(
    (activityId: number) => {
      overlay.open(({ isOpen, close }) => (
        <PastActivityReportModal
          profile={profile}
          activityId={activityId}
          isOpen={isOpen}
          close={() => {
            close();
            refetch();
          }}
          clubId={clubId}
        />
      ));
    },
    [profile, clubId],
  );

  return (
    <TableOuter>
      <Table
        table={table}
        count={data.length}
        emptyMessage={t("empty")}
        onClick={row => openPastActivityReportModal(row.id)}
      />
    </TableOuter>
  );
};

export default ActivityReportList;
