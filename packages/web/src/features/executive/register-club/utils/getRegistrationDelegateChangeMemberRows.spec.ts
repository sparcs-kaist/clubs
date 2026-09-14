import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ApiClb020ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb020";

import getRegistrationDelegateChangeMemberRows, {
  isRegistrationDelegateChangeButtonVisible,
} from "./getRegistrationDelegateChangeMemberRows.ts";

const detail = {
  effectiveAt: new Date("2026-08-27T14:59:00.000Z"),
  isChangeable: true,
  hasRegistration: false,
  delegates: [{ studentId: 10 }],
  members: [
    { studentId: 10, name: "이전 대표자", isRegularMember: true },
    { studentId: 20, name: "신규 대표자", isRegularMember: true },
  ],
} as ApiClb020ResponseOk;

describe("getRegistrationDelegateChangeMemberRows", () => {
  it("removes member actions after a registration document is submitted", () => {
    const before = getRegistrationDelegateChangeMemberRows(detail, 42);
    const after = getRegistrationDelegateChangeMemberRows(
      { ...detail, hasRegistration: true },
      42,
    );

    assert.equal(before.length, 2);
    assert.deepEqual(after, []);
  });

  it("updates button visibility after a role change", () => {
    const before = getRegistrationDelegateChangeMemberRows(detail, 42);
    const after = getRegistrationDelegateChangeMemberRows(
      { ...detail, delegates: [{ ...detail.delegates[0], studentId: 20 }] },
      42,
    );

    assert.deepEqual(
      before.map(member => [
        member.studentId,
        isRegistrationDelegateChangeButtonVisible(member),
      ]),
      [
        [10, false],
        [20, true],
      ],
    );
    assert.deepEqual(
      after.map(member => [
        member.studentId,
        isRegistrationDelegateChangeButtonVisible(member),
      ]),
      [
        [10, true],
        [20, false],
      ],
    );
  });
});
