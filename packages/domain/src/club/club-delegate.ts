import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zStudent } from "@clubs/domain/user/student";

import { zClub } from "./club";

extendZodWithOpenApi(z);

export enum ClubDelegateEnum {
  Representative = 1, // 대표자
  Delegate1, // 대의원 1
  Delegate2, // 대의원 2
}

export const zClubDelegate = z.object({
  id: zId.openapi({
    description: "동아리 대표자 상태 ID",
    examples: [1, 2, 3],
  }),
  club: z.object({ id: zClub.shape.id }),
  student: z.object({ id: zStudent.shape.id }),
  clubDelegateEnum: z.coerce
    .number()
    .int()
    .min(1)
    .transform(val => z.nativeEnum(ClubDelegateEnum).parse(val))
    .openapi({
      description: "동아리 대표자의 지위 종류 1: 대표자 2: 대의원1 3: 대의원2",
      examples: [
        Number(ClubDelegateEnum.Representative),
        Number(ClubDelegateEnum.Delegate1),
        Number(ClubDelegateEnum.Delegate2),
      ],
    }),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export type IClubDelegate = z.infer<typeof zClubDelegate>;
