import { ClubDelegateEnum as Role } from "@clubs/interface/common/enum/club.enum";

import { canTransferClubDelegateRole } from "./delegate-change-policy";

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
