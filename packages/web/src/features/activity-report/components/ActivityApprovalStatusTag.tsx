import React from "react";

import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import Tag from "@sparcs-clubs/web/common/components/Tag";
import { ApplyTagList } from "@sparcs-clubs/web/constants/tableTagList";
import ProfessorApprovalEnum, {
  getProfessorApprovalLabel,
  getProfessorApprovalTagColor,
} from "@sparcs-clubs/web/types/professorApproval";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

type ActivityApprovalStatusTagProps =
  | {
      type: "executive";
      status: number;
      width?: string;
    }
  | {
      type: "professor";
      status: ProfessorApprovalEnum | null;
      width?: string;
    };

const ActivityApprovalStatusTag: React.FC<ActivityApprovalStatusTagProps> = ({
  type,
  status,
  width = "fit-content",
}) => {
  if (type === "professor") {
    if (status === null) {
      return (
        <Tag color="GRAY" width={width}>
          -
        </Tag>
      );
    }

    return (
      <Tag color={getProfessorApprovalTagColor(status)} width={width}>
        {getProfessorApprovalLabel(status)}
      </Tag>
    );
  }

  const { color, text } = getTagDetail(
    status as ActivityStatusEnum,
    ApplyTagList,
  );

  return (
    <Tag color={color} width={width}>
      {text}
    </Tag>
  );
};

export default ActivityApprovalStatusTag;
