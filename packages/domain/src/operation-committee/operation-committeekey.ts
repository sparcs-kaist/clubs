import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const zOperationCommitteeKey = z.object({
  id: z.coerce.number().openapi({
    description: "운영위원 비밀키 ID",
    examples: [1, 2, 3],
  }),
  secretKey: z.string().openapi({
    description: "10자리로 구성된 운영위원 비밀키",
    examples: ["8d502cdea9", "760c1ae02b"],
  }),
  createdAt: z.coerce.date().openapi({
    description: "비밀키가 생성된 시각",
    example: String(new Date()),
  }),
  deletedAt: z.coerce
    .date()
    .nullable()
    .openapi({
      description: "비밀키 삭제된 시각, 활성화 중이면 null",
      example: String(new Date()),
    }),
});

export type IOperationCommitteeKey = z.infer<typeof zOperationCommitteeKey>;
