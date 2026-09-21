import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";

import { zExtractId } from "../common/utils";

extendZodWithOpenApi(z);

export const StudentEnum = {
  Undergraduate: 1,
  Master: 2,
  Doctor: 3,
  MasterDoctorDoctor: 4,
  MasterDoctorMaster: 5,
  AllPrograms: 6,
  Auditor: 7,
  Exchange: 8,
} as const;

export type StudentEnum = (typeof StudentEnum)[keyof typeof StudentEnum];

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
    .max(255)
    .openapi({ description: "학생의 이름입니다", example: "홍길동" }),
  email: z.string().max(255).optional().openapi({
    description: "학생의 카이스트 메일입니다",
    example: "example@kait.ac.kr",
  }),
  phoneNumber: z.string().max(30).optional().openapi({
    description: "학생의 한국 전화번호입니다",
    example: "010-1234-5678",
  }),
});

//todo: 미완성 상태. 사용하지 말것.
export const zStudentHistory = z.object({
  id: zId,
  studentId: zExtractId(zStudent),
  studentEnum: z.nativeEnum(StudentEnum),
  StudentStatusEnum: z.nativeEnum(StudentStatusEnum),
  department: z.coerce.number().int().min(1), // 학부코드
  semester: zExtractId(zSemester),
  startTerm: z.coerce.date(), // 언젠가 정상화 필요
  endTerm: z.coerce.date(), // 언젠가 정상화 필요
});

export type IStudent = z.infer<typeof zStudent>;
export type IStudentHistory = z.infer<typeof zStudentHistory>;
