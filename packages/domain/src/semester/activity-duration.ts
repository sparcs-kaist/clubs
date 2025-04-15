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
    description: "활동반기 ID",
    examples: [1, 2, 3],
  }),
  semester: z.object({ id: zSemester.shape.id }).openapi({
    description: "이 활동반기와 연관된 학기",
    examples: [{ id: 15 }, { id: 16 }, { id: 17 }],
  }),
  activityDurationTypeEnum: z.nativeEnum(ActivityDurationTypeEnum).openapi({
    description: `활동반기 분류
    1: 정규 활동 보고서에 들어가는 활동반기(Regular)
    2: 신규등록 신청용 활동 보고서에 들어가는 활동반기(Registration)
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
      description: "활동반기명",
      examples: ["겨울-봄", "여름-가을", "봄 신규등록", "가을 신규등록"],
    }),
  startTerm: z.coerce.date().openapi({
    description:
      "활동반기 시작일. 정규: 계절학기 시작일, 신규등록: 전년도 정규학기 시작일",
    examples: ["2024-06-15", "2024-02-23"],
  }),
  endTerm: z.coerce.date().openapi({
    description:
      "활동반기 종료일. 정규: 다음 반기 계절학기 시작일, 신규등록: 해당연도 정규학기 시작일",
    examples: ["2024-12-20", "2025-02-25"],
  }),
});

export type IActivityDuration = z.infer<typeof zActivityDuration>;
