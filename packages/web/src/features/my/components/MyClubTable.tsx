import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { ApiReg012ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg012";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  getDivisionTagColor,
  RegistrationStatusTagList,
  RegistrationTypeTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface MyClubTableProps {
  clubRegisterList: ApiReg012ResponseOk;
}
const columnHelper =
  createColumnHelper<ApiReg012ResponseOk["registrations"][number]>();

const useColumns = () => {
  const t = useTranslations("my.overview");
  const clubT = useTranslations("club");
  const divisionT = useTranslations("division");
  const commonT = useTranslations("common");
  const { isEnglish } = useLanguage();
  return useMemo(
    () => [
      columnHelper.accessor("registrationStatusEnum", {
        id: "registrationStatusEnum",
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
      columnHelper.accessor("registrationTypeEnum", {
        id: "registrationTypeEnum",
        header: t("columns.type"),
        cell: info => {
          const { color, text } = getTagDetail(
            info.getValue(),
            RegistrationTypeTagList,
          );
          return (
            <Tag color={color}>
              {t(
                `registrationType.${({ "재등록": "renewal", "신규 등록": "promotional", "가등록": "provisional" } as Record<string, string>)[text] ?? "unknown"}`,
              )}
            </Tag>
          );
        },
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
      columnHelper.accessor(
        row => (isEnglish ? row.activityFieldEn : "") || row.activityFieldKr,
        {
          id: "activityFieldKr",
          header: t("columns.activityField"),
          cell: info => info.getValue(),
          size: 255,
        },
      ),
      columnHelper.accessor("professorName", {
        id: "professorName",
        header: commonT("지도교수"),
        cell: info => info.getValue() ?? "-",
        size: 128,
      }),
    ],
    [t, clubT, divisionT, commonT, isEnglish],
  );
};

const MyClubTable: React.FC<MyClubTableProps> = ({ clubRegisterList }) => {
  const t = useTranslations("my.overview");
  const columns = useColumns();
  const table = useReactTable({
    columns,
    data: clubRegisterList.registrations,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });
  const getRowLink = (row: ApiReg012ResponseOk["registrations"][number]) => ({
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
export default MyClubTable;
