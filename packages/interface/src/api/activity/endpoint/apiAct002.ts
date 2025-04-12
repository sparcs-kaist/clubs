import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

/**
 * @version v0.1
 * @description 활동보고서의 활동을 조회합니다
 * 동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.
 * 활동보고서 작성 기간에 관계없이 조회 가능합니다.
 */

const url = (activityId: number) =>
  `/student/activities/activity/${activityId}`;
const method = "GET";

const requestParam = z.object({
  activityId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubId: z.coerce.number().int().min(1),
    originalName: z.string().max(255),
    name: z.string().max(255),
    activityTypeEnumId: z.nativeEnum(ActivityTypeEnum),
    durations: z.array(
      z.object({
        startTerm: z.coerce.date(),
        endTerm: z.coerce.date(),
      }),
    ),
    location: z.string().max(255),
    purpose: z.string(),
    detail: z.string(),
    evidence: z.string(),
    evidenceFiles: z.array(
      z.object({
        fileId: z.string().max(255),
        name: z.string().max(255),
        url: z.string().max(255),
      }),
    ),
    participants: z.array(
      z.object({
        studentId: z.coerce.number().int().min(1),
        studentNumber: z.coerce.number().int().min(20000000),
        name: z.string().max(255),
      }),
    ),
    activityStatusEnumId: z.nativeEnum(ActivityStatusEnum),
    comments: z.array(
      z.object({
        content: z.string(),
        createdAt: z.coerce.date(),
      }),
    ),
    updatedAt: z.coerce.date(),
    professorApprovedAt: z.coerce.date().nullable(),
    editedAt: z.coerce.date(),
    commentedAt: z.coerce.date().nullable(),
  }),
};

const responseErrorMap = {};

const apiAct002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct002RequestParam = z.infer<typeof apiAct002.requestParam>;
type ApiAct002RequestQuery = z.infer<typeof apiAct002.requestQuery>;
type ApiAct002RequestBody = z.infer<typeof apiAct002.requestBody>;
type ApiAct002ResponseOk = z.infer<(typeof apiAct002.responseBodyMap)[200]>;

export default apiAct002;

export type {
  ApiAct002RequestParam,
  ApiAct002RequestQuery,
  ApiAct002RequestBody,
  ApiAct002ResponseOk,
};
