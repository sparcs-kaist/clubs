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
  deletedAt: z.coerce.date().nullable(),
});

// 외부 entity의 값을 전부 받아온 형태.
export const zMemberRegistrationResponse = zMemberRegistration.extend({
  student: zStudent,
  club: zClub,
  semester: zSemester,
});

export type IMemberRegistration = z.infer<typeof zMemberRegistration>;
export type IMemberRegistrationResponse = z.infer<
  typeof zMemberRegistrationResponse
>;
