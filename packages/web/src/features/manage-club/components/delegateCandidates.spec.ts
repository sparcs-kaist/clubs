import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ApiClb008ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb008";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { getDelegateCandidateItems } from "./delegateCandidates";

type Candidate = ApiClb008ResponseOk["students"][number];

const member: Candidate = {
  id: 1,
  studentNumber: "20260001",
  name: "홍길동",
  phoneNumber: "010-1234-5678",
  currentRoles: [],
};

const getItem = (
  targetRole: ClubDelegateEnum,
  currentRoles: Candidate["currentRoles"] = [],
  pendingStudentIds = new Set<number>(),
) =>
  getDelegateCandidateItems(
    [{ ...member, currentRoles }],
    1,
    targetRole,
    pendingStudentIds,
  )[0];

describe("delegate candidate labels and selection", () => {
  it("omits phone numbers and allows members without a current role", () => {
    Object.values(ClubDelegateEnum).forEach(role => {
      const item = getItem(role);
      assert.equal(item.label, "20260001 홍길동");
      assert.equal(item.selectable, true);
    });
  });

  it("shows other clubs' roles and blocks those members for every target role", () => {
    const currentRoles = [
      {
        clubId: 2,
        clubName: "여로",
        delegateEnumId: ClubDelegateEnum.Delegate1,
      },
      {
        clubId: 3,
        clubName: "Khartes",
        delegateEnumId: ClubDelegateEnum.Representative,
      },
    ];
    currentRoles.forEach(currentRole => {
      Object.values(ClubDelegateEnum).forEach(targetRole => {
        assert.equal(getItem(targetRole, [currentRole]).selectable, false);
      });
    });
    assert.equal(
      getItem(ClubDelegateEnum.Representative, [currentRoles[0]]).label,
      "20260001 홍길동 (여로 대의원1)",
    );
    assert.equal(
      getItem(ClubDelegateEnum.Representative, [currentRoles[1]]).label,
      "20260001 홍길동 (Khartes 대표자)",
    );
  });

  it("allows a current deputy to become representative, but not another deputy", () => {
    [ClubDelegateEnum.Delegate1, ClubDelegateEnum.Delegate2].forEach(role => {
      const currentRoles = [
        { clubId: 1, clubName: "술박스", delegateEnumId: role },
      ];
      assert.equal(
        getItem(ClubDelegateEnum.Representative, currentRoles).selectable,
        true,
      );
      assert.equal(
        getItem(ClubDelegateEnum.Delegate1, currentRoles).selectable,
        false,
      );
      assert.equal(
        getItem(ClubDelegateEnum.Delegate2, currentRoles).selectable,
        false,
      );
    });
  });

  it("blocks the current representative and members with pending requests", () => {
    const currentRoles = [
      {
        clubId: 1,
        clubName: "술박스",
        delegateEnumId: ClubDelegateEnum.Representative,
      },
    ];
    Object.values(ClubDelegateEnum).forEach(role => {
      assert.equal(getItem(role, currentRoles).selectable, false);
      assert.equal(getItem(role, [], new Set([member.id])).selectable, false);
    });
  });

  it("blocks duplicate active roles and displays every current role", () => {
    const currentRoles = [
      {
        clubId: 1,
        clubName: "술박스",
        delegateEnumId: ClubDelegateEnum.Delegate1,
      },
      {
        clubId: 2,
        clubName: "여로",
        delegateEnumId: ClubDelegateEnum.Delegate2,
      },
    ];
    const item = getItem(ClubDelegateEnum.Representative, currentRoles);
    assert.equal(item.selectable, false);
    assert.equal(item.label, "20260001 홍길동 (술박스 대의원1) (여로 대의원2)");
  });
});
