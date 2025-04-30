import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = () => `/student/activities`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zClub.shape.id,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z
    .object({
      id: zActivity.shape.id,
      activityStatusEnumId: zActivity.shape.activityStatusEnum,
      name: zActivity.shape.name,
      activityTypeEnumId: zActivity.shape.activityTypeEnum,
      durations: zActivity.shape.durations,
      professorApprovedAt: zActivity.shape.professorApprovedAt,
      editedAt: zActivity.shape.editedAt,
      commentedAt: zActivity.shape.commentedAt,
    })
    .array(),
};

const responseErrorMap = {};

const apiAct005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct005RequestParam = z.infer<typeof apiAct005.requestParam>;
type ApiAct005RequestQuery = z.infer<typeof apiAct005.requestQuery>;
type ApiAct005RequestBody = z.infer<typeof apiAct005.requestBody>;
type ApiAct005ResponseOk = z.infer<(typeof apiAct005.responseBodyMap)[200]>;

export default apiAct005;

export type {
  ApiAct005RequestBody,
  ApiAct005RequestParam,
  ApiAct005RequestQuery,
  ApiAct005ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  description: `
  # ACT-005

  현재 학기의 활동보고서를 조회합니다.

  동아리 대표자로 로그인되어 있어야 합니다.
  `,
  summary: "ACT-005: 현재 학기의 활동보고서를 조회합니다.",
  request: {
    query: requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 현재 학기의 활동보고서를 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
