import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";
import { zStudent } from "@clubs/domain/user/student";

import { zExtractId } from "../common/utils";

extendZodWithOpenApi(z);

export enum ClubMemberTypeEnum {
  Regular = 1, // 정회원
  Associate = 2, // 준회원
}

export const zClubMember = z.object({
  id: zId.openapi({
    description: "동아리 소속 멤버 상태 ID",
    examples: [1, 2, 3],
  }),
  club: zExtractId(zClub),
  student: zExtractId(zStudent),
  semester: zExtractId(zSemester),
  clubMemberTypeEnum: z.nativeEnum(ClubMemberTypeEnum).openapi({
    description: "회원의 상태 1: 정회원 2: 준회원",
    examples: [ClubMemberTypeEnum.Regular, ClubMemberTypeEnum.Associate],
  }), // 비즈니스 로직으로 추가할 것
});

export type IClubMember = z.infer<typeof zClubMember>;
