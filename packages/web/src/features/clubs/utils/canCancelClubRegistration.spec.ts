import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import canCancelClubRegistration from "./canCancelClubRegistration.ts";

describe("canCancelClubRegistration", () => {
  it("allows executives to cancel regular and provisional clubs only", () => {
    assert.equal(
      canCancelClubRegistration(UserTypeEnum.Executive, ClubTypeEnum.Regular),
      true,
    );
    assert.equal(
      canCancelClubRegistration(
        UserTypeEnum.Executive,
        ClubTypeEnum.Provisional,
      ),
      true,
    );
    assert.equal(
      canCancelClubRegistration(
        UserTypeEnum.Executive,
        ClubTypeEnum.RegistrationCanceled,
      ),
      false,
    );
    assert.equal(
      canCancelClubRegistration(
        UserTypeEnum.Undergraduate,
        ClubTypeEnum.Regular,
      ),
      false,
    );
  });
});
