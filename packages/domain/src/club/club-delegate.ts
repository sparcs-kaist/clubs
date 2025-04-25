import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zStudent } from "@clubs/domain/user/student";

extendZodWithOpenApi(z);

export enum ClubDelegateEnum {
  Representative = 1, // 대표자
  Delegate1, // 대의원 1
  Delegate2, // 대의원 2
}

export const zClubDelegate = z.object({
  id: zId,
  student: zStudent.pick({ id: true }),
  clubDelegateEnum: z.nativeEnum(ClubDelegateEnum),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export type IClubDelegate = z.infer<typeof zClubDelegate>;
