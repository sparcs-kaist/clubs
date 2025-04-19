import React from "react";

import Tag, { TagColor } from "@sparcs-clubs/web/common/components/Tag";

export enum ProfessorApproval {
  PENDING = "대기",
  APPROVED = "승인",
  REJECTED = "반려",
}

interface AdvisorProfessorApprovalTagProps {
  professorApproval: ProfessorApproval;
}

const getProfessorApprovalTagColor = (
  professorApproval: ProfessorApproval,
): TagColor => {
  switch (professorApproval) {
    case ProfessorApproval.PENDING:
      return "GRAY";
    case ProfessorApproval.APPROVED:
      return "GREEN";
    default: // REJECTED
      return "RED";
  }
};

const AdvisorProfessorApprovalTag: React.FC<
  AdvisorProfessorApprovalTagProps
> = ({ professorApproval }) => (
  <Tag color={getProfessorApprovalTagColor(professorApproval)}>
    {professorApproval}
  </Tag>
);

export default AdvisorProfessorApprovalTag;
