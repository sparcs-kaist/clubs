import assert from "node:assert/strict";
import { it } from "node:test";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { getUserType } from "./getUserType.ts";
import isStudent from "./isStudent.ts";

it("recognizes both integrated phases, all programs, and auditors as students", () => {
  const studentTypes = [
    UserTypeEnum.Undergraduate,
    UserTypeEnum.Master,
    UserTypeEnum.Doctor,
    UserTypeEnum.MasterDoctorDoctor,
    UserTypeEnum.MasterDoctorMaster,
    UserTypeEnum.AllPrograms,
    UserTypeEnum.Auditor,
  ];
  Object.values(UserTypeEnum).forEach(type => {
    assert.equal(
      isStudent({ id: 1, name: "학생", type }),
      studentTypes.includes(type),
      type,
    );
  });
  assert.equal(isStudent(), false);
});

it("labels each academic program distinctly", () => {
  assert.equal(
    getUserType(UserTypeEnum.MasterDoctorDoctor),
    "석박통합과정(박사)",
  );
  assert.equal(
    getUserType(UserTypeEnum.MasterDoctorMaster),
    "석박통합과정(석사)",
  );
  assert.equal(getUserType(UserTypeEnum.AllPrograms), "과정전체");
  assert.equal(getUserType(UserTypeEnum.Auditor), "청강생");
  assert.equal(getUserType(UserTypeEnum.Doctor), "박사과정");
});
