import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";
import { zStudent } from "@clubs/domain/user/student";

extendZodWithOpenApi(z);

export enum RegistrationApplicationStudentStatusEnum {
  Pending = 1, // 대기중
  Approved, // 승인됨
  Rejected, // 반려됨
}

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
