import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import { TagColor } from "@sparcs-clubs/web/common/components/Tag";

const ProfessorApprovalLabel: Record<ProfessorApprovalStatus, string> = {
  [ProfessorApprovalStatus.Pending]: "미승인",
  [ProfessorApprovalStatus.Approved]: "승인",
  [ProfessorApprovalStatus.LateApproved]: "지연 승인",
};
export const getProfessorApprovalLabel = (
  professorApproval: ProfessorApprovalStatus,
): string => ProfessorApprovalLabel[professorApproval];

const ProfessorApprovalTagColor: Record<ProfessorApprovalStatus, TagColor> = {
  [ProfessorApprovalStatus.Pending]: "GRAY",
  [ProfessorApprovalStatus.Approved]: "GREEN",
  [ProfessorApprovalStatus.LateApproved]: "ORANGE",
};
export const getProfessorApprovalTagColor = (
  professorApproval: ProfessorApprovalStatus,
): TagColor => ProfessorApprovalTagColor[professorApproval];
