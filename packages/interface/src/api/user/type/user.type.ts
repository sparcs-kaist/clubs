import { z } from "zod";

import { zStudentNumber } from "@sparcs-clubs/interface/common/type/user.type";

export const zStudent = z.object({
  id: z.number(),
  userId: z.number().optional(),
  studentNumber: zStudentNumber,
  name: z.string(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const zStudentSummary = zStudent.pick({
  id: true,
  userId: true,
  name: true,
  studentNumber: true,
});

export const zProfessor = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
});

export const zProfessorSummary = zProfessor.pick({
  id: true,
  name: true,
});

export const zExecutive = z.object({
  id: z.number(),
  userId: z.number().optional(),
  studentNumber: zStudentNumber,
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
export type IProfessorSummary = z.infer<typeof zProfessorSummary>;
