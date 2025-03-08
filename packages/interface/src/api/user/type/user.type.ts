import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zSemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";
import {
  ProfessorEnum,
  StudentStatusEnum,
} from "@sparcs-clubs/interface/common/enum/user.enum";
import { zId } from "@sparcs-clubs/interface/common/type/id.type";

extendZodWithOpenApi(z);

const zUser = z
  .object({
    id: zId.openapi({ description: "user ID", example: 1 }),
    sid: z
      .string()
      .max(30)
      .openapi({ description: "sparcs sso ID", example: "sparcs21" }),
    name: z
      .string()
      .max(30)
      .openapi({ description: "user name", example: "홍길동" }),
    email: z.string().email().openapi({
      description: "kaist email",
      example: "sparcs@kaist.ac.kr",
    }),
    phoneNumber: z.string().max(30).openapi({
      description: "korean phone number",
      example: "010-0000-0000",
    }),
  })
  .openapi("User");

export const zStudent = z.object({
  id: z.coerce
    .number()
    .openapi({ description: "학생 ID, 학번과는 무관합니다.", example: 1 }),
  userId: z.number().optional().openapi({
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

export const zProfessor = z.object({
  id: z.number(),
  userId: z.number().nullable(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().optional(),
  professorEnum: z.nativeEnum(ProfessorEnum),
  department: z.number(),
});

export const zExecutive = z.object({
  id: z.number(),
  userId: z.number().optional(),
  studentNumber: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  // TODO: 다음 칼럼들 논의 및 추가
  // executiveBureauEnum
  // executiveStatusEnum
  // account: 계좌번호? 이거 테이블엔 없네요?
  // doingClubs: ClubSummary[]; // 이름 정하기 필요
});

export const zExecutiveSummary = zExecutive.pick({
  id: true,
  userId: true,
  name: true,
  studentNumber: true,
});

export type IStudent = z.infer<typeof zStudent>;
export type IStudentSummary = z.infer<typeof zStudentSummary>;
export type IExecutive = z.infer<typeof zExecutive>;
export type IExecutiveSummary = z.infer<typeof zExecutiveSummary>;
export type IProfessor = z.infer<typeof zProfessor>;

const generator = new OpenApiGeneratorV31([zUser]);
generator.generateComponents();
