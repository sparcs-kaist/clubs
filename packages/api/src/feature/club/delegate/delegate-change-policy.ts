import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

const REQUEST_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000;

export function pendingDelegateChangeWhere(now: Date) {
  return {
    clubDelegateChangeRequestStatusEnumId:
      ClubDelegateChangeRequestStatusEnum.Applied,
    createdAt: { gt: new Date(now.getTime() - REQUEST_LIFETIME_MS) },
  };
}

export function requiresLegacyRepresentativeTerm(
  role: ClubDelegateEnum,
  termId: number | null,
) {
  const isRepresentative = role === ClubDelegateEnum.Representative;
  const isMissingTerm = termId === null;
  const needsLegacyTerm = isRepresentative && isMissingTerm;
  return needsLegacyTerm;
}

export function matchesLegacyRepresentativeTerm(
  terms: { id: number; studentId: number }[],
  requesterId: number,
): boolean {
  const isUnique = terms.length === 1;
  const isRequester = terms[0]?.studentId === requesterId;
  const isUnambiguous = isUnique && isRequester;
  return isUnambiguous;
}
