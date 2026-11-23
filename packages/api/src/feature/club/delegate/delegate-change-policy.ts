import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

const REQUEST_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000;

export function canTransferClubDelegateRole(
  currentRole: ClubDelegateEnum,
  targetRole: ClubDelegateEnum,
) {
  const deputyRoles: ClubDelegateEnum[] = [
    ClubDelegateEnum.Delegate1,
    ClubDelegateEnum.Delegate2,
  ];
  const isDeputy = deputyRoles.includes(currentRole);
  const isRepresentativeTarget = targetRole === ClubDelegateEnum.Representative;
  const canTransfer = isDeputy && isRepresentativeTarget;
  return canTransfer;
}

export function pendingDelegateChangeWhere(now: Date) {
  return {
    clubDelegateChangeRequestStatusEnumId:
      ClubDelegateChangeRequestStatusEnum.Applied,
    createdAt: { gt: new Date(now.getTime() - REQUEST_LIFETIME_MS) },
  };
}

export function isLatestDelegateChangeRequestVisible(
  request: {
    clubDelegateChangeRequestStatusEnumId: number;
    createdAt: Date;
    deletedAt: Date | null;
  },
  now: Date,
) {
  const isCanceled = request.deletedAt !== null;
  const isApplied =
    request.clubDelegateChangeRequestStatusEnumId ===
    ClubDelegateChangeRequestStatusEnum.Applied;
  const isExpired =
    request.createdAt.getTime() <= now.getTime() - REQUEST_LIFETIME_MS;
  const shouldHide = !isCanceled && isApplied && isExpired;
  return !shouldHide;
}
