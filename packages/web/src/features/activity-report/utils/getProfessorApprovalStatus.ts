import ProfessorApprovalEnum from "@sparcs-clubs/web/types/professorApproval";

interface GetProfessorApprovalStatusBaseParam {
  professorApprovedAt?: Date | string | null;
}

function getProfessorApprovalStatus(
  param: GetProfessorApprovalStatusBaseParam & { hasProfessor: false },
): null;
function getProfessorApprovalStatus(
  param: GetProfessorApprovalStatusBaseParam & { hasProfessor?: true },
): ProfessorApprovalEnum;
function getProfessorApprovalStatus(
  param: GetProfessorApprovalStatusBaseParam & { hasProfessor: boolean },
): ProfessorApprovalEnum | null;
function getProfessorApprovalStatus({
  hasProfessor = true,
  professorApprovedAt,
}: GetProfessorApprovalStatusBaseParam & {
  hasProfessor?: boolean;
}): ProfessorApprovalEnum | null {
  if (!hasProfessor) {
    return null;
  }

  return professorApprovedAt
    ? ProfessorApprovalEnum.Approved
    : ProfessorApprovalEnum.Pending;
}

export default getProfessorApprovalStatus;
