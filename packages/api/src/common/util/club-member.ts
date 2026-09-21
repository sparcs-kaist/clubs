import { StudentEnum } from "@clubs/interface/common/enum/user.enum";

export function isRegularClubMember(
  studentEnumId: number | undefined,
  studentNumber: string | undefined,
): boolean {
  const isUndergraduate = studentEnumId === StudentEnum.Undergraduate;
  const hasRegularStudentNumber = Number(studentNumber?.slice(-4)) < 6000;
  const isRegular = isUndergraduate && hasRegularStudentNumber;
  return isRegular;
}
