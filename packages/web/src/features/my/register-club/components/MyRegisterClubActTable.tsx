import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React, { useMemo } from "react";
import styled from "styled-components";

import { ApiAct011ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct011";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  ActStatusTagList,
  ActTypeTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import PastActivityReportModal from "@sparcs-clubs/web/features/register-club/components/activity-report/PastActivityReportModal";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface MyRegisterClubActTableProps {
  clubRegisterActList: ApiAct011ResponseOk;
  profile: string;
  clubId: number;
}

const TableWrapper = styled.div`
  overflow: hidden;
  -ms-overflow-style: none;

  ::-webkit-scrollbar {
    display: none;
  }
`;

const columnHelper =
  createColumnHelper<ApiAct011ResponseOk["activities"][number]>();

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
    id: "activityName",
    header: t("name"),
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    id: "activityType",
    header: t("division"),
    cell: info => {
      const { color } = getTagDetail(info.getValue(), ActTypeTagList);
      return <Tag color={color}>{t(`types.${info.getValue()}`)}</Tag>;
    },
    size: 128,
  }),
  columnHelper.accessor(
    row =>
      `${format.dateTime(new Date(row.durations[0].startTerm), { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })} ~ ${format.dateTime(new Date(row.durations[0].endTerm), { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}${row.durations.length > 1 ? t("additionalPeriods", { count: row.durations.length - 1 }) : ""}`,
    {
      id: "activityPeriod",
      header: t("period"),
      cell: info => info.getValue(),
      size: 255,
    },
  ),
];

const MyRegisterClubActTable: React.FC<MyRegisterClubActTableProps> = ({
  clubRegisterActList,
  profile,
  clubId,
}) => {
  const t = useTranslations("my.registration.activity");
  const format = useFormatter();
  const columns = useMemo(() => getColumns(t, format), [format, t]);

  const table = useReactTable({
    columns,
    data: clubRegisterActList.activities,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const openPastActivityReportModal = (activityId: number) => {
    overlay.open(({ isOpen, close }) => (
      <PastActivityReportModal
        profile={profile}
        activityId={activityId}
        isOpen={isOpen}
        close={close}
        viewOnly
        clubId={clubId}
      />
    ));
  };

  return (
    <TableWrapper>
      <Table
        table={table}
        emptyMessage={t("empty")}
        onClick={row => openPastActivityReportModal(row.id)}
      />
    </TableWrapper>
  );
};

export default MyRegisterClubActTable;
