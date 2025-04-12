import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zSemester } from "@clubs/interface/api/semester/type/semester.type";
import { zStudent } from "@clubs/interface/api/user/type/user.type";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";
import { zId } from "@clubs/interface/common/type/id.type";
import { registry } from "@clubs/interface/open-api";

export const zMemberRegistration = z.object({
  id: zId.openapi({ description: "가입 신청 ID", examples: [1, 2, 3] }),
  student: z.object({ id: zStudent.shape.id }),
  club: z.object({ id: zClub.shape.id }),
  //semester: z.object({ id: zSemester.shape.id }),
  semester: zSemester.pick({ id: true }),
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

export type IMemberRegistration = z.infer<typeof zMemberRegistration>;
export type IMemberRegistrationResponse = z.infer<
  typeof zMemberRegistrationResponse
>;

// let a: IMemberRegistration;
