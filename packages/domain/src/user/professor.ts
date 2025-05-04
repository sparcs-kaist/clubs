import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
export enum ProfessorEnum {
  Assistant = 1, // 조교수
  Associate, // 부교수
  Full, // 정교수
}

export const zProfessor = z.object({
  id: z.coerce.number(),
  userId: z.coerce.number().nullable(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().optional(),
  professorEnum: z.nativeEnum(ProfessorEnum),
  department: z.coerce.number(),
});

export type IProfessor = z.infer<typeof zProfessor>;
