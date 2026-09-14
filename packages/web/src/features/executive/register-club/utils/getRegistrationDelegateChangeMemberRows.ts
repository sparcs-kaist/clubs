import type { ApiClb020ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb020";

type Member = ApiClb020ResponseOk["members"][number];

export type RegistrationDelegateChangeMemberRow = Member & {
  clubId: number;
  effectiveAt: Date;
  isChangeable: boolean;
  isCurrentDelegate: boolean;
};

export const isRegistrationDelegateChangeButtonVisible = (
  member: RegistrationDelegateChangeMemberRow,
) => member.isRegularMember && !member.isCurrentDelegate;

const getRegistrationDelegateChangeMemberRows = (
  data: ApiClb020ResponseOk | undefined,
  clubId: number,
): RegistrationDelegateChangeMemberRow[] => {
  if (data?.hasRegistration) return [];

  const currentDelegateIds = new Set(
    data?.delegates.map(delegate => delegate.studentId),
  );

  return (data?.members ?? []).map(member => ({
    ...member,
    clubId,
    effectiveAt: data?.effectiveAt ?? new Date(0),
    isChangeable: data?.isChangeable ?? false,
    isCurrentDelegate: currentDelegateIds.has(member.studentId),
  }));
};

export default getRegistrationDelegateChangeMemberRows;
