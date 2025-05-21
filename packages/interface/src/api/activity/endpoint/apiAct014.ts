import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";

import { registry } from "@clubs/interface/open-api";

import apiAct002 from "./apiAct002";

/**
 * @version v0.1
 * @description 활동보고서의 활동을 조회합니다
 * 집행부원으로 로그인되어 있어야 합니다.
 * 활동보고서 작성 기간에 관계없이 조회 가능합니다.
 */

const url = (activityId: number) =>
  `/executive/activities/activity/${activityId}`;
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

const apiAct014 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct014RequestParam = z.infer<typeof apiAct014.requestParam>;
type ApiAct014RequestQuery = z.infer<typeof apiAct014.requestQuery>;
type ApiAct014RequestBody = z.infer<typeof apiAct014.requestBody>;
type ApiAct014ResponseOk = z.infer<(typeof apiAct014.responseBodyMap)[200]>;

export default apiAct014;

export type {
  ApiAct014RequestParam,
  ApiAct014RequestQuery,
  ApiAct014RequestBody,
  ApiAct014ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: "/executive/activities/activity/:activityId",
  summary: "ACT-014: 집행부원이 활동보고서의 활동을 조회합니다.",
  description: `
  # ACT-014

  활동보고서의 활동을 조회합니다.

  집행부원으로 로그인되어 있어야 합니다.

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
