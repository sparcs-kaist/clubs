import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
export const ProfessorEnum = {
  Assistant: 1, // 조교수
  Associate: 2, // 부교수
  Full: 3, // 정교수
} as const;

export type ProfessorEnum = (typeof ProfessorEnum)[keyof typeof ProfessorEnum];

export const zProfessor = z.object({
  id: z.coerce.number(),
  userId: z.coerce.number().optional(),
  name: z.string().max(255),
  email: z.string().max(255),
  phoneNumber: z.string().max(30).optional(),
  professorEnum: z.nativeEnum(ProfessorEnum),
  department: z.coerce.number(),
});

export type IProfessor = z.infer<typeof zProfessor>;
