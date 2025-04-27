import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";

import { registry } from "@clubs/interface/open-api";

import apiAct002 from "./apiAct002";

/**
 * @version v0.1
 * @description 활동보고서의 활동을 조회합니다
 * 교수로 로그인되어 있어야 합니다.
 * 활동보고서 작성 기간에 관계없이 조회 가능합니다.
 */

const url = (activityId: number) =>
  `/professor/activities/activity/${activityId}`;
const method = "GET";

const requestParam = z.object({
  activityId: zActivity.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: apiAct002.responseBodyMap[HttpStatusCode.Ok],
};

const responseErrorMap = {};

const apiAct015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct015RequestParam = z.infer<typeof apiAct015.requestParam>;
type ApiAct015RequestQuery = z.infer<typeof apiAct015.requestQuery>;
type ApiAct015RequestBody = z.infer<typeof apiAct015.requestBody>;
type ApiAct015ResponseOk = z.infer<(typeof apiAct015.responseBodyMap)[200]>;

export default apiAct015;

export type {
  ApiAct015RequestParam,
  ApiAct015RequestQuery,
  ApiAct015RequestBody,
  ApiAct015ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: "/professor/activities/activity/:activityId",
  summary: "ACT-015: 지도교수 활동보고서 활동 조회",
  description: `
  # ACT-015

  활동보고서의 활동을 조회합니다.

  동아리 지도교수로 로그인되어 있어야 합니다.

  활동보고서 작성 기간에 관계없이 조회 가능합니다.
  `,
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
