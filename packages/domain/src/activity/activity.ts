import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zId } from "@clubs/domain/common/id";
import { zExtractId } from "@clubs/domain/common/utils";
import { zFile } from "@clubs/domain/file/file";
import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zExecutive } from "@clubs/domain/user/executive";
import { zStudent } from "@clubs/domain/user/student";

extendZodWithOpenApi(z);

export enum ActivityTypeEnum {
  matchedInternalActivity = 1,
  matchedExternalActivity,
  notMatchedActivity,
}

export enum ActivityStatusEnum {
  Applied = 1, // 신청
  Approved, // 승인
  Rejected, // 반려
  Committee, // 운영위원회
}

export const zActivity = z.object({
  id: zId,
  club: zExtractId(zClub),
  name: z
    .string()
    .max(255)
    .min(1)
    .openapi({
      description: "활동 이름",
      examples: ["딸기파티", "동아리 정기총회"],
    }),
  activityTypeEnum: z.nativeEnum(ActivityTypeEnum),
  activityStatusEnum: z.nativeEnum(ActivityStatusEnum),
  activityDuration: z.object({ id: zActivityDuration.shape.id }),
  durations: z
    .array(
      z.object({
        startTerm: z.coerce.date(),
        endTerm: z.coerce.date(),
      }),
    )
    .min(1),
  location: z.string().max(255),
  purpose: z.string(),
  detail: z.string(),
  evidence: z.string(),
  evidenceFiles: z.array(zExtractId(zFile)),
  participants: z.array(zExtractId(zStudent)),

  // 비정규화 메모 필드
  chargedExecutive: zExtractId(zExecutive).nullable(),
  editedAt: z.coerce.date(),
  professorApprovedAt: z.coerce.date().nullable(),
  commentedAt: z.coerce.date().nullable(),
  commentedExecutive: zExtractId(zExecutive).nullable(),
});

export type IActivity = z.infer<typeof zActivity>;
