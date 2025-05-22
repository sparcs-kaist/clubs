import { ColumnHelper } from "@tanstack/react-table";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  ClubTypeTagList,
  getDivisionTagColor,
} from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

export interface OverviewFilteredRow {
  clubId: number;
  divisionName: string;
  district: string;
  clubTypeEnum: ClubTypeEnum;
  clubNameKr: string;
}

export default function OverviewCommonColumns<
  ApiOvvResponseOK extends OverviewFilteredRow,
>(columnHelper: ColumnHelper<ApiOvvResponseOK>) {
  return [
    columnHelper.accessor(row => row.clubTypeEnum, {
      id: "clubTypeEnum",
      header: "구분",
      cell: info => {
        const { color, text } = getTagDetail(info.getValue(), ClubTypeTagList);
        return <Tag color={color}>{text}</Tag>;
      },
      size: 100,
      filterFn: (row, _, value: string[]) =>
        value.includes(
          {
            [ClubTypeEnum.Regular]: "정동아리",
            [ClubTypeEnum.Provisional]: "가동아리",
          }[row.original.clubTypeEnum as ClubTypeEnum],
        ),
    }),
    columnHelper.accessor(row => row.district, {
      id: "district",
      header: "분과구",
      size: 100,
    }),
    columnHelper.accessor(row => row.divisionName, {
      id: "divisionName",
      header: "분과",
      cell: info => (
        <Tag color={getDivisionTagColor(info.getValue())}>
          {info.getValue()}
        </Tag>
      ),
      size: 100,
      filterFn: (row, _, value: string[]) =>
        value.includes(row.original.divisionName),
    }),
    columnHelper.accessor(row => row.clubNameKr, {
      id: "clubNameKr",
      header: "동아리 대표명칭",
      size: 120,
      filterFn: (row, _, value: string) =>
        row.original.clubNameKr.includes(value),
    }),
  ];
}
