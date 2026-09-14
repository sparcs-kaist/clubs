import { Prisma } from "@prisma/client";

import { isClubNameConflict } from "./registration-error";

const databaseError = (databaseCode: string, key: string, code = "P2010") =>
  new Prisma.PrismaClientKnownRequestError("test database error", {
    code,
    clientVersion: "test",
    meta: { code: databaseCode, message: `Duplicate entry for key '${key}'` },
  });

describe("club name conflict classification", () => {
  it.each([
    ["1062", "club.name_kr", true],
    ["1062", "club.name_en", true],
    ["9999", "club.name_kr", false],
    ["1062", "other_constraint", false],
  ])("classifies database code %s and key %s", (code, key, expected) => {
    expect(isClubNameConflict(databaseError(code, key))).toBe(expected);
  });

  it("does not classify other errors as a duplicate club name", () => {
    expect(isClubNameConflict(new Error("database unavailable"))).toBe(false);
    expect(
      isClubNameConflict(databaseError("1062", "club.name_kr", "P2002")),
    ).toBe(false);
  });
});
