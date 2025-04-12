import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

extendZodWithOpenApi(z);

export const zUser = z
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
