import { z } from "zod";

import { zClubSummary } from "@clubs/interface/api/club/type/club.type";
import { zFileSummary } from "@clubs/interface/api/file/type/file.type";
import { zActivityDuration } from "@clubs/interface/api/semester/type/activity.duration.type";
import {
  zExecutiveSummary,
  zStudentSummary,
} from "@clubs/interface/api/user/type/user.type";
import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";
import { zId } from "@clubs/interface/common/type/id.type";

// TODO: 수정 필요
export const zActivity = z.object({
  id: zId,
  club: zClubSummary.pick({ id: true }),
  name: z.string().max(255).min(1),
  activityTypeEnum: z.nativeEnum(ActivityTypeEnum),
  activityStatusEnum: z.nativeEnum(ActivityStatusEnum),
  activityDuration: zActivityDuration.pick({ id: true }),
  durations: z.array(
    z.object({
      id: zId,
      startTerm: z.coerce.date(),
      endTerm: z.coerce.date(),
    }),
  ),
  location: z.string().max(255),
  purpose: z.string(),
  detail: z.string(),
  evidence: z.string(),
  evidenceFiles: z.array(zFileSummary.pick({ id: true })),
  participants: z.array(zStudentSummary.pick({ id: true })),
  chargedExecutive: zExecutiveSummary.pick({ id: true }).optional(),
  commentedExecutive: zExecutiveSummary.pick({ id: true }).optional(),
  commentedAt: z.coerce.date().nullable(),
  editedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const zActivityComment = z.object({
  id: zId,
  content: z.string(),
  createdAt: z.coerce.date(),
  executive: zExecutiveSummary.pick({ id: true }),
});

export const zActivityCommentSummary = zActivityComment.pick({
  id: true,
  content: true,
  createdAt: true,
});

export const zActivityCommentResponse = zActivityComment.extend({
  executive: zExecutiveSummary,
});

export const zActivityResponse = zActivity.extend({
  club: zClubSummary,
  evidenceFiles: z.array(zFileSummary),
  participants: z.array(zStudentSummary),
  chargedExecutive: zExecutiveSummary.optional(),
  commentedExecutive: zExecutiveSummary.optional(),
  comments: z.array(zActivityCommentSummary),
});

export const zActivitySummary = zActivity.pick({
  id: true,
  activityStatusEnum: true,
  activityTypeEnum: true,
  club: true,
  name: true,
  chargedExecutive: true,
  commentedExecutive: true,
  commentedAt: true,
  editedAt: true,
  updatedAt: true,
});

export const zActivitySummaryResponse = zActivitySummary.extend({
  club: zClubSummary,
});

// TODO: 수정 필요
export const zActivityD = z.object({
  id: z.coerce.number().int().min(1),
  startTerm: z.date(),
  endTerm: z.date(),
});

export type IActivitySummary = z.infer<typeof zActivitySummary>;
export type IActivityResponseSummary = z.infer<typeof zActivitySummaryResponse>;
export type IActivityD = z.infer<typeof zActivityD>;
export type IActivityResponse = z.infer<typeof zActivityResponse>;
export type IActivity = z.infer<typeof zActivity>;
export type IActivityComment = z.infer<typeof zActivityComment>;
export type IActivityCommentSummary = z.infer<typeof zActivityCommentSummary>;
export type IActivityCommentResponse = z.infer<typeof zActivityCommentResponse>;
