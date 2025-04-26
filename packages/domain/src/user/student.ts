import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";

extendZodWithOpenApi(z);

export enum StudentStatusEnum {
  Attending = 1, // 재학
  LeaveOfAbsence, // 휴학
}

export const zStudent = z.object({
  id: z.coerce
    .number()
    .openapi({ description: "학생 ID, 학번과는 무관합니다.", example: 1 }),
  userId: z.coerce.number().optional().openapi({
    description: "유저 id, User 객체의 ID입니다.",
    example: 2,
  }),
  studentNumber: z.string().openapi({
    description: "학생의 학번입니다.",
    example: "20250001",
  }),
  name: z
    .string()
    .openapi({ description: "학생의 이름입니다", example: "홍길동" }),
  email: z.string().optional().openapi({
    description: "학생의 카이스트 메일입니다",
    example: "example@kait.ac.kr",
  }),
  phoneNumber: z.string().optional().openapi({
    description: "학생의 한국 전화번호입니다",
    example: "010-1234-5678",
  }),
});

//todo: 미완성 상태. 사용하지 말것.
export const zStudentHistory = z.object({
  id: zId,
  studentId: zStudent.pick({ id: true }),
  studentEnum: z.nativeEnum(StudentStatusEnum), // TODO: 학생 재학 상태를
  StudentStatusEnum: z.nativeEnum(StudentStatusEnum), // TODO: 두 enum 정확히 비교 필요
  department: z.coerce.number().int().min(1), // 학부코드
  semester: zSemester.pick({ id: true }),
  startTerm: z.coerce.date(), // 해당 상태가 시작된 시각
  endTerm: z.coerce.date(), // 해당 상태가 종료된 시각
});

export const zStudentSummary = zStudent.pick({
  id: true,
  userId: true,
  name: true,
  studentNumber: true,
});
