import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zStudent } from "@clubs/domain/user/student";

import { zClub } from "./club";

extendZodWithOpenApi(z);

export enum ClubDelegateChangeRequestStatusEnum {
  Applied = 1, // 제출
  Approved, // 승인
  Rejected, // 반려
}

export const zClubDelegateChangeRequest = z.object({
  id: zId,
  club: z.object({ id: zClub.shape.id }),
  prevStudent: z.object({ id: zStudent.shape.id }),
  student: z.object({ id: zStudent.shape.id }),
  clubDelegateChangeRequestStatusEnum: z.nativeEnum(
    ClubDelegateChangeRequestStatusEnum,
  ),
});

export type IClubDelegateChangeRequest = z.infer<
  typeof zClubDelegateChangeRequest
>;
