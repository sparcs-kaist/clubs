import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

export const getStoredProfessorApprovalStatus = (registration: {
  professorApprovedAt?: Date | null;
  professorApprovalStatus?: ProfessorApprovalStatus | null;
}): ProfessorApprovalStatus => {
  if (!registration.professorApprovedAt) return ProfessorApprovalStatus.Pending;
  return registration.professorApprovalStatus ===
    ProfessorApprovalStatus.LateApproved
    ? ProfessorApprovalStatus.LateApproved
    : ProfessorApprovalStatus.Approved;
};
