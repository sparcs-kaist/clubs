import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = (activityId: number) =>
  `/student/activities/activity/${activityId}`;
const method = "GET";

const requestParam = z.object({
  activityId: zActivity.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubId: zClub.shape.id,
    name: zActivity.shape.name,
    activityTypeEnumId: zActivity.shape.activityTypeEnum, // ActivityTypeEnum.id는 양의 정수로 가정
    durations: zActivity.shape.durations,
    location: zActivity.shape.location,
    purpose: zActivity.shape.purpose,
    detail: zActivity.shape.detail,
    evidence: zActivity.shape.evidence,
    // TODO: zActivity.shape.evidenceFiles는 id를 써서 uid랑 둘중 무엇을 이용할지 결정해야함
    evidenceFiles: z.array(
      z.object({
        fileId: z.string().max(255),
        name: z.string().max(255),
        url: z.string().max(255),
      }),
    ),
    // TODO: zActivity.shape.participants는 id를 써서 studentId와 둘중 무엇을 이용할지 결정해야함
    participants: z.array(
      z.object({
        studentId: z.coerce.number().int().min(1),
        studentNumber: z.coerce.number().int().min(20000000),
        name: z.string().max(255),
      }),
    ),
    activityStatusEnumId: zActivity.shape.activityStatusEnum,
    // TODO: domain object로 교체
    comments: z.array(
      z.object({
        content: z.string(),
        createdAt: z.coerce.date(),
      }),
    ),
    // TODO: domain object로 교체
    updatedAt: z.coerce.date(),
    // TODO: domain object로 교체
    professorApprovedAt: z.coerce.date().nullable(),
    // TODO: domain object로 교체
    editedAt: z.coerce.date(),
    // TODO: domain object로 교체
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

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: "/student/activities/activity/:activityId",
  description: `
  # ACT-002

  활동보고서의 활동을 조회합니다.

  동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.

  활동보고서 작성 기간에 관계없이 조회 가능합니다.
  `,
  summary: "ACT-002: 활동보고서의 활동을 조회합니다.",
  request: {
    params: requestParam,
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공적으로 활동보고서의 활동을 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
