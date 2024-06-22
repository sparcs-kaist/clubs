import React from "react";

import { ApiCms006ResponseOk } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms006";
import { CommonSpaceUsageOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/commonSpace.enum";

import TableCell from "@sparcs-clubs/web/common/components/Table/TableCell";
import {
  TableRow,
  TableWrapper,
} from "@sparcs-clubs/web/common/components/Table/TableWrapper";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  formatDate,
  formatDateTime,
  formatTime,
} from "@sparcs-clubs/web/utils/Date/formateDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import type { StatusDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface CommonSpaceTableProps {
  spaceList: ApiCms006ResponseOk;
}

const TagList: {
  [key in CommonSpaceUsageOrderStatusEnum]: StatusDetail;
} = {
  [CommonSpaceUsageOrderStatusEnum.Applied]: { text: "신청", color: "BLUE" },
  [CommonSpaceUsageOrderStatusEnum.Canceled]: { text: "취소", color: "GRAY" },
  [CommonSpaceUsageOrderStatusEnum.Used]: { text: "사용", color: "GREEN" },
};

const MyCommonSpaceTable: React.FC<CommonSpaceTableProps> = ({ spaceList }) => (
  <TableWrapper>
    <TableRow>
      <TableCell type="Header" width="10%" minWidth={90}>
        상태
      </TableCell>
      <TableCell type="Header" width="20%" minWidth={220}>
        신청 일시
      </TableCell>
      <TableCell type="Header" width="10%" minWidth={120}>
        동아리
      </TableCell>
      <TableCell type="Header" width="16%" minWidth={180}>
        예약 일자
      </TableCell>
      <TableCell type="Header" width="16%" minWidth={160}>
        예약 시간
      </TableCell>
      <TableCell type="Header" width="28%">
        예약 호실
      </TableCell>
    </TableRow>
    {spaceList.items.map((space, index) => {
      const { color, text } = getTagDetail(space.statusEnum, TagList);
      return (
        <TableRow isBorder key={space.chargeStudentName + String(index)}>
          <TableCell type="Tag" width="10%" minWidth={90}>
            <Tag color={color}>{text}</Tag>
          </TableCell>
          <TableCell type="Default" width="20%" minWidth={220}>
            {formatDateTime(space.createdAt)}
          </TableCell>
          <TableCell type="Default" width="10%" minWidth={120}>
            {space.chargeStudentName}
          </TableCell>
          <TableCell type="Default" width="16%" minWidth={180}>
            {formatDate(space.startTerm)}
          </TableCell>
          <TableCell type="Default" width="16%" minWidth={160}>
            {formatTime(space.startTerm)} ~ {formatTime(space.endTerm)}
          </TableCell>
          <TableCell type="Default" width="28%">
            {space.spaceName}
          </TableCell>
        </TableRow>
      );
    })}
  </TableWrapper>
);

export default MyCommonSpaceTable;
