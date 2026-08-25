import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import type { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";

import getClubRegistrationCancellationRows from "./getClubRegistrationCancellationRows.ts";

const club = (
  id: number,
  nameKr: string,
  nameEn: string,
  type: ClubTypeEnum,
): ApiClb001ResponseOK["divisions"][number]["clubs"][number] => ({
  id,
  nameKr,
  nameEn,
  type,
  isPermanent: false,
  characteristic: null,
  representative: "대표자",
  advisor: null,
  totalMemberCnt: 1,
});

const divisions: ApiClb001ResponseOK["divisions"] = [
  {
    id: 1,
    name: "생활문화",
    clubs: [
      club(1, "알파", "Alpha", ClubTypeEnum.Regular),
      club(2, "베타", "Beta", ClubTypeEnum.Provisional),
      club(3, "감마", "Gamma", ClubTypeEnum.RegistrationCanceled),
    ],
  },
];

describe("getClubRegistrationCancellationRows", () => {
  it("returns only active regular and provisional clubs", () => {
    assert.deepEqual(
      getClubRegistrationCancellationRows(divisions, "").map(row => row.id),
      [1, 2],
    );
  });

  it("searches Korean and English club names", () => {
    assert.deepEqual(
      getClubRegistrationCancellationRows(divisions, "alp").map(row => row.id),
      [1],
    );
    assert.deepEqual(
      getClubRegistrationCancellationRows(divisions, "베타").map(row => row.id),
      [2],
    );
  });
});
