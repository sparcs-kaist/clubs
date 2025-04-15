import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";

extendZodWithOpenApi(z);

export enum ActivityDurationTypeEnum {
  Regular = 1, // 정규 활동 보고서
  Registration = 2, // 신규등록용 활동보고서
}

export const zActivityDuration = z.object({
  id: zId.openapi({
    description: "활동기간 ID",
    examples: [1, 2, 3],
  }),
  semester: z.object({ id: zSemester.shape.id }).openapi({
    description: "이 기간과 연관된 학기",
    examples: [{ id: 15 }, { id: 16 }, { id: 17 }],
  }),
  activityDurationTypeEnum: z.nativeEnum(ActivityDurationTypeEnum).openapi({
    description: `활동기간 분류
    1: 정규 활동 보고서에 들어가는 활동기간(Regular)
    2: 신규등록 신청용 활동 보고서에 들어가는 활동기간(Registration)
    `,
    examples: [1, 2],
  }),
  year: z.coerce
    .number()
    .int()
    .min(1)
    .openapi({
      description: "년도",
      examples: [2023, 2024],
    }),
  name: z
    .string()
    .max(10)
    .min(1)
    .openapi({
      description: "활동기간명",
      examples: ["겨울봄", "여름가을"],
    }),
  startTerm: z.coerce.date().openapi({
    description: "활동기간 시작일",
    examples: ["2023-01-01", "2024-08-01"],
  }),
  endTerm: z.coerce.date().openapi({
    description: "활동기간 종료일",
    examples: ["2023-07-30", "2024-12-31"],
  }),
});

export type IActivityDuration = z.infer<typeof zActivityDuration>;
