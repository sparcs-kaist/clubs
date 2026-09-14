import { HttpStatusCode } from "axios";
import { z } from "zod";

const numericValue = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .refine(value => Number(value) > 0 && Number(value) <= 2147483647);

const requestQuery = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    value: z.string().trim().email().max(255),
  }),
  z.object({ type: z.literal("studentId"), value: numericValue }),
  z.object({ type: z.literal("studentNumber"), value: numericValue }),
  z.object({ type: z.literal("professorId"), value: numericValue }),
]);

/** 집행부가 로그인할 대상 계정을 검색합니다. */
const apiAut005 = {
  url: () => "/executive/auth/exchange-login/users",
  method: "GET",
  requestParam: z.object({}),
  requestQuery,
  requestBody: z.object({}),
  responseBodyMap: {
    [HttpStatusCode.Ok]: z.object({
      users: z.array(
        z.object({
          userId: z.coerce.number().int().positive(),
          name: z.string(),
          email: z.string().nullable(),
          students: z.array(
            z.object({
              studentId: z.coerce.number().int().positive(),
              studentNumber: z.coerce.number().int().positive(),
            }),
          ),
          professors: z.array(
            z.object({ professorId: z.coerce.number().int().positive() }),
          ),
        }),
      ),
    }),
  },
  responseErrorMap: {},
};

export type ApiAut005RequestQuery = z.infer<typeof requestQuery>;
export type ApiAut005ResponseOk = z.infer<
  (typeof apiAut005.responseBodyMap)[200]
>;
export default apiAut005;
