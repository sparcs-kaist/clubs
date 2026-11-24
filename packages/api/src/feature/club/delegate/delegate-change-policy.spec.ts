import {
  ClubDelegateChangeRequestStatusEnum as Status,
  ClubDelegateEnum as Role,
} from "@clubs/interface/common/enum/club.enum";

import {
  canTransferClubDelegateRole,
  isLatestDelegateChangeRequestVisible,
} from "./delegate-change-policy";

describe("canTransferClubDelegateRole", () => {
  it.each<[Role, Role, boolean]>([
    [Role.Representative, Role.Representative, false],
    [Role.Representative, Role.Delegate1, false],
    [Role.Representative, Role.Delegate2, false],
    [Role.Delegate1, Role.Representative, true],
    [Role.Delegate1, Role.Delegate1, false],
    [Role.Delegate1, Role.Delegate2, false],
    [Role.Delegate2, Role.Representative, true],
    [Role.Delegate2, Role.Delegate1, false],
    [Role.Delegate2, Role.Delegate2, false],
  ])("allows moving role %s to %s: %s", (currentRole, targetRole, expected) => {
    expect(canTransferClubDelegateRole(currentRole, targetRole)).toBe(expected);
  });
});

describe("isLatestDelegateChangeRequestVisible", () => {
  const now = new Date("2026-11-23T03:00:00Z");
  const lifetime = 72 * 60 * 60 * 1000;

  it.each<[Status, boolean, number, boolean]>([
    [Status.Applied, false, lifetime - 1, true],
    [Status.Applied, false, lifetime, false],
    [Status.Applied, false, lifetime + 1, false],
    [Status.Applied, true, lifetime + 1, true],
    [Status.Rejected, false, lifetime + 1, true],
    [Status.Approved, false, lifetime + 1, true],
    [Status.Applied, true, lifetime - 1, true],
  ])(
    "status %s, canceled %s and age %s is visible: %s",
    (status, canceled, age, expected) => {
      expect(
        isLatestDelegateChangeRequestVisible(
          {
            clubDelegateChangeRequestStatusEnumId: status,
            deletedAt: canceled ? now : null,
            createdAt: new Date(now.getTime() - age),
          },
          now,
        ),
      ).toBe(expected);
    },
  );
});
