import type { ApiClb008ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb008";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

export const delegateRoleLabels = {
  [ClubDelegateEnum.Representative]: "대표자",
  [ClubDelegateEnum.Delegate1]: "대의원1",
  [ClubDelegateEnum.Delegate2]: "대의원2",
};

export const getDelegateCandidateItems = (
  members: ApiClb008ResponseOk["students"],
  clubId: number,
  targetRole: ClubDelegateEnum,
  pendingStudentIds: Set<number>,
) =>
  members.map(member => {
    const roles = member.currentRoles;
    const roleLabels = roles
      .map(
        role =>
          ` (${role.clubName} ${delegateRoleLabels[role.delegateEnumId]})`,
      )
      .join("");
    const canBecomeRepresentative =
      targetRole === ClubDelegateEnum.Representative &&
      roles.length === 1 &&
      roles[0].clubId === clubId &&
      roles[0].delegateEnumId !== ClubDelegateEnum.Representative;

    return {
      label: `${member.studentNumber} ${member.name}${roleLabels}`,
      value: String(member.id),
      selectable:
        !pendingStudentIds.has(member.id) &&
        (roles.length === 0 || canBecomeRepresentative),
    };
  });
