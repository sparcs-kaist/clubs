import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";

import { zSemester } from "../semester/semester";

extendZodWithOpenApi(z);

export enum ClubMemberTypeEnum {
  Regular = 1, // 정회원
  Associate = 2, // 준회원
}

export const zClubMember = z.object({
  id: zId,
  clubId: zId,
  studentId: zId,
  semester: z.object({ id: zSemester.shape.id }),
  clubMemberTypeEnum: z.nativeEnum(ClubMemberTypeEnum), // 비즈니스 로직으로 추가할 것
});

export type IClubMember = z.infer<typeof zClubMember>;
