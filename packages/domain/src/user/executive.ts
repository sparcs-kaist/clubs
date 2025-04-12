import { z } from "zod";

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

export type IExecutive = z.infer<typeof zExecutive>;
export type IExecutiveSummary = z.infer<typeof zExecutiveSummary>;
