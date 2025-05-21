import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = (activityTermId: number) =>
  `/student/activities/activity-terms/activity-term/${activityTermId}`;
const method = "GET";

const requestParam = z.object({
  // TODO: domain object로 교체
  activityTermId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({
  clubId: zClub.shape.id,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activities: z.array(
      z.object({
        id: zActivity.shape.id,
        name: zActivity.shape.name,
        activityTypeEnumId: zActivity.shape.activityTypeEnum,
        durations: zActivity.shape.durations,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct006RequestParam = z.infer<typeof apiAct006.requestParam>;
type ApiAct006RequestQuery = z.infer<typeof apiAct006.requestQuery>;
type ApiAct006RequestBody = z.infer<typeof apiAct006.requestBody>;
type ApiAct006ResponseOk = z.infer<(typeof apiAct006.responseBodyMap)[200]>;

export default apiAct006;

export type {
  ApiAct006RequestBody,
  ApiAct006RequestParam,
  ApiAct006RequestQuery,
  ApiAct006ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: "/student/activities/activity-terms/activity-term/:activityTermId",
  description: `
  # ACT-006

  동아리의 특정 활동반기의 활동보고서를 조회합니다.

  동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.
  `,
  summary: "ACT-006: 해당 활동 기간의 활동보고서 목록을 조회합니다",
  request: {
    params: requestParam,
    query: requestQuery,
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
      description:
        "성공적으로 동아리의 특정 활동반기의 활동보고서를 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
