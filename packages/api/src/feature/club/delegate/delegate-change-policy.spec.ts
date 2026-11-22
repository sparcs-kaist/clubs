import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import {
  matchesLegacyRepresentativeTerm,
  requiresLegacyRepresentativeTerm,
} from "./delegate-change-policy";

describe("legacy representative request", () => {
  const representative = ClubDelegateEnum.Representative;
  const delegate = ClubDelegateEnum.Delegate1;

  it("reconstructs a missing term only for a representative request", () => {
    expect(requiresLegacyRepresentativeTerm(representative, null)).toBe(true);
    expect(requiresLegacyRepresentativeTerm(representative, 1)).toBe(false);
    expect(requiresLegacyRepresentativeTerm(delegate, null)).toBe(false);
  });

  it("requires a unique historical term belonging to the requester", () => {
    const term = { id: 1, studentId: 2 };
    expect(matchesLegacyRepresentativeTerm([term], 2)).toBe(true);
    expect(matchesLegacyRepresentativeTerm([term], 3)).toBe(false);
    expect(matchesLegacyRepresentativeTerm([term, { ...term, id: 2 }], 2)).toBe(
      false,
    );
  });
});
