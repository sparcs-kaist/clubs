import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zSemester } from "@sparcs-clubs/interface/api/club/type/semester.type";
import { zStudent } from "@sparcs-clubs/interface/api/user/type/user.type";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import zId from "@sparcs-clubs/interface/common/type/id.type";

export const zMemberRegistration = z.object({
  id: zId,
  student: zStudent.pick({ id: true }),
  club: zClub.pick({ id: true }),
  semester: zSemester.pick({ id: true }),
  registrationApplicationStudentEnum: z.nativeEnum(
    RegistrationApplicationStudentStatusEnum,
  ),
  createdAt: z.coerce.date(),
});

// 외부 entity의 값을 전부 받아온 형태.
export const zMemberRegistrationResponse = zMemberRegistration.extend({
  student: zStudent,
  club: zClub,
  semester: zSemester,
});

// repository에 전달하는 parameter의 type.
export const zMemberRegistrationCreate = zMemberRegistration
  .omit({
    id: true,
    registrationApplicationStudentEnum: true,
    createdAt: true,
  })
  .transform(data => ({
    studentId: data.student.id,
    clubId: data.club.id,
    semesterId: data.semester.id,
  }));

export const zMemberRegistrationUpdate = zMemberRegistration.pick({
  id: true,
  registrationApplicationStudentEnum: true,
});

export type IMemberRegistration = z.infer<typeof zMemberRegistration>;
export type IMemberRegistrationResponse = z.infer<
  typeof zMemberRegistrationResponse
>;
export type IMemberRegistrationCreate = z.infer<
  typeof zMemberRegistrationCreate
>;
export type IMemberRegistrationUpdate = z.infer<
  typeof zMemberRegistrationUpdate
>;
