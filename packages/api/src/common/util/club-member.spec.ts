import { StudentEnum } from "@clubs/interface/common/enum/user.enum";

import { isRegularClubMember } from "./club-member";

describe("isRegularClubMember", () => {
  it.each([
    [StudentEnum.Undergraduate, "20260001", true],
    [StudentEnum.Undergraduate, "20265999", true],
    [StudentEnum.Undergraduate, "20266000", false],
    [StudentEnum.Undergraduate, "20998369", false],
    [StudentEnum.Master, "20260001", false],
    [StudentEnum.Master, "20998369", false],
    [StudentEnum.Doctor, "20260001", false],
    [StudentEnum.MasterDoctorDoctor, "20260001", false],
    [StudentEnum.MasterDoctorMaster, "20260001", false],
    [StudentEnum.AllPrograms, "20260001", false],
    [StudentEnum.Auditor, "20260001", false],
    [StudentEnum.Exchange, "20260001", false],
    [StudentEnum.Exchange, "20266001", false],
    [undefined, "20260001", false],
    [StudentEnum.Undergraduate, undefined, false],
  ])("classifies degree %s and number %s as %s", (degree, number, expected) => {
    expect(isRegularClubMember(degree, number)).toBe(expected);
  });
});
