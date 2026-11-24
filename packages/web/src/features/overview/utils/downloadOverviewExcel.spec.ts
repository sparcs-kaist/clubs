import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { it } from "node:test";
import * as XLSX from "sheetjs-style";

import type { ApiOvv001ResponseOK } from "@clubs/interface/api/overview/endpoint/apiOvv001";
import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";

const { registerHooks } = createRequire(import.meta.url)("node:module");
const aliasHook = registerHooks({
  resolve(
    specifier: string,
    context: unknown,
    nextResolve: (nextSpecifier: string, nextContext: unknown) => unknown,
  ) {
    const target =
      specifier ===
      "@sparcs-clubs/web/features/overview/utils/clubBuildingNames"
        ? new URL("./clubBuildingNames.ts", import.meta.url).href
        : specifier;
    return nextResolve(target, context);
  },
});
const { createDelegateOverviewSheet } =
  await import("./downloadOverviewExcel.ts");
aliasHook.deregister();

it("exports both delegates' contact columns and leaves missing contacts blank", () => {
  const representative = {
    clubId: 1,
    delegateType: ClubDelegateEnum.Representative,
    name: "대표자",
    studentNumber: 20240001,
    department: "전산학부",
    phoneNumber: "010-1234-5678",
    kaistEmail: "rep@kaist.ac.kr",
  };
  const club: ApiOvv001ResponseOK[number] = {
    clubId: 1,
    district: "학술",
    divisionName: "학술",
    clubTypeEnum: ClubTypeEnum.Regular,
    clubNameKr: "동아리",
    clubNameEn: "Club",
    representative,
    delegate1: {
      ...representative,
      delegateType: ClubDelegateEnum.Delegate1,
      phoneNumber: "010-2222-3333",
      kaistEmail: "one@kaist.ac.kr",
    },
    delegate2: {
      ...representative,
      delegateType: ClubDelegateEnum.Delegate2,
      phoneNumber: null,
      kaistEmail: "two@kaist.ac.kr",
    },
  };
  const workbook = XLSX.utils.book_new();
  const sheet = createDelegateOverviewSheet([
    club,
    {
      ...club,
      clubId: 2,
      clubTypeEnum: ClubTypeEnum.Provisional,
      delegate1: undefined,
      delegate2: undefined,
    },
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "delegates");
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const result = XLSX.read(bytes, { type: "array" }).Sheets.delegates;

  assert.deepEqual(
    ["L2", "M2", "Q2", "R2"].map(cell => result[cell]?.v),
    ["휴대전화", "KAIST E-Mail", "휴대전화", "KAIST E-Mail"],
  );
  assert.deepEqual(
    ["G4", "L4", "M4", "Q4", "R4"].map(cell => result[cell]?.v),
    [
      "010-1234-5678",
      "010-2222-3333",
      "one@kaist.ac.kr",
      undefined,
      "two@kaist.ac.kr",
    ],
  );
  assert.equal(result.L4.t, "s");
  assert.equal(result.Q6, undefined);
  assert.deepEqual(
    result["!merges"]?.slice(-2).map(merge => XLSX.utils.encode_range(merge)),
    ["I1:M1", "N1:R1"],
  );
});
