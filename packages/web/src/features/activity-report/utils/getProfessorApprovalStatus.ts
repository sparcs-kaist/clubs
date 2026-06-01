import ProfessorApprovalEnum from "@sparcs-clubs/web/types/professorApproval";

interface GetProfessorApprovalStatusParam {
  hasProfessor?: boolean;
  professorApprovedAt?: Date | string | null;
}

const getProfessorApprovalStatus = ({
  hasProfessor = true,
  professorApprovedAt,
}: GetProfessorApprovalStatusParam): ProfessorApprovalEnum | null => {
  if (!hasProfessor) {
    return null;
  }

  return professorApprovedAt
    ? ProfessorApprovalEnum.Approved
    : ProfessorApprovalEnum.Pending;
};

export default getProfessorApprovalStatus;
