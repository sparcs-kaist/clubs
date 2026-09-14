import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getProfessorManageClubId } from "./getProfessorManageClubId.ts";

describe("getProfessorManageClubId", () => {
  const clubs = [{ id: 1 }, { id: 2 }];

  it("selects the requested managed club and follows query changes", () => {
    ["2", "1", "2"].forEach(id => {
      assert.equal(getProfessorManageClubId(clubs, id), Number(id));
    });
  });

  it("falls back to the first club for missing, invalid, or unmanaged IDs", () => {
    [
      null,
      "",
      "0",
      "-2",
      "2.5",
      "02",
      "0x2",
      "2e0",
      " 2 ",
      "NaN",
      "Infinity",
      "9007199254740993",
      "3",
    ].forEach(id => {
      assert.equal(getProfessorManageClubId(clubs, id), 1);
    });
  });

  it("falls back when the requested club is no longer managed", () => {
    assert.equal(getProfessorManageClubId([{ id: 1 }], "2"), 1);
    assert.equal(getProfessorManageClubId([], "2"), null);
  });
});
