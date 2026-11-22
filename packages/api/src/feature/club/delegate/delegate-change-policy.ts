import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

const REQUEST_LIFETIME_MS = 3 * 24 * 60 * 60 * 1000;

export function pendingDelegateChangeWhere(now: Date) {
  return {
    clubDelegateChangeRequestStatusEnumId:
      ClubDelegateChangeRequestStatusEnum.Applied,
    createdAt: { gt: new Date(now.getTime() - REQUEST_LIFETIME_MS) },
  };
}
