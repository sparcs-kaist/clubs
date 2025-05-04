import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";

import { registry } from "@clubs/interface/open-api";

const url = (activityId: number) =>
  `/student/activities/activity/${activityId}`;
const method = "DELETE";

const requestParam = z.object({
  activityId: zActivity.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct004 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct004RequestParam = z.infer<typeof apiAct004.requestParam>;
type ApiAct004RequestQuery = z.infer<typeof apiAct004.requestQuery>;
type ApiAct004RequestBody = z.infer<typeof apiAct004.requestBody>;
type ApiAct004ResponseOk = z.infer<(typeof apiAct004.responseBodyMap)[200]>;

export default apiAct004;

export type {
  ApiAct004RequestParam,
  ApiAct004RequestQuery,
  ApiAct004RequestBody,
  ApiAct004ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "delete",
  path: "/student/activities/activity/:activityId",
  description: `
  # ACT-004

  활동보고서의 활동을 삭제합니다.

  동아리 대표자로 로그인되어 있어야 합니다.
  `,
  summary: "ACT-004: 동아리 대표자가 활동보고서의 활동을 삭제합니다.",
  request: {},
  responses: {
    200: {
      description: "성공적으로 삭제되었습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
  },
});
