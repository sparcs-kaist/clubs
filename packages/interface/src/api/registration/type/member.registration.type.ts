import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zSemester } from "@sparcs-clubs/interface/api/club/type/semester.type";
import { zStudent } from "@sparcs-clubs/interface/api/user/type/user.type";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import zId from "@sparcs-clubs/interface/common/type/id.type";
import { registry } from "@sparcs-clubs/interface/open-api";

export const zMemberRegistration = z.object({
  id: zId.openapi({ description: "가입 신청 ID", examples: [1, 2, 3] }),
  student: z.object({ id: zStudent.shape.id }),
  club: z.object({ id: zClub.shape.id }),
  semester: z.object({ id: zSemester.shape.id }),
  registrationApplicationStudentEnum: z
    .nativeEnum(RegistrationApplicationStudentStatusEnum)
    .openapi({ description: "1: 대기 2: 승인 3: 반려", examples: [1, 2, 3] }),
  createdAt: z.coerce.date().openapi({
    description: "신청이 생성된 시각",
    example: String(new Date()),
  }),
});

registry.register("MemberRegistration", zMemberRegistration); // 아래 schema에 표시함

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
