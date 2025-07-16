import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

extendZodWithOpenApi(z);

export const zClub = z.object({
  id: zId.openapi({
    description: "동아리 ID",
    examples: [1, 2, 3],
  }),
  // plain schema
  nameKr: z.string().max(255).min(1).openapi({
    description: "동아리의 한국어 이름입니다.",
    example: "술박스",
  }),
  nameEn: z.string().max(255).min(1).openapi({
    description: "동아리의 영어 이름입니다.",
    example: "sulbox",
  }),
  description: z.string().openapi({
    description: "동아리 설명",
    examples: [
      "다같이 연주하는 동아리입니다",
      "요리를 좋아하는 사람들이 모인 동아리입니다",
    ],
  }),
  foundingYear: z.coerce.number().openapi({
    description: "동아리 설립년도",
    examples: [2001, 2020],
  }),
});

export type IClub = z.infer<typeof zClub>;
