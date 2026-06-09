import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 신규등록용 활동보고서의 활동반기를 조회합니다.
 */

const url = () => `/student/provisional/activity-duration`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activityDuration: zActivityDuration,
  }),
};

const responseErrorMap = {};

const apiAct030 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct030RequestParam = z.infer<typeof apiAct030.requestParam>;
type ApiAct030RequestQuery = z.infer<typeof apiAct030.requestQuery>;
type ApiAct030RequestBody = z.infer<typeof apiAct030.requestBody>;
type ApiAct030ResponseOk = z.infer<(typeof apiAct030.responseBodyMap)[200]>;

export default apiAct030;

export type {
  ApiAct030RequestBody,
  ApiAct030RequestParam,
  ApiAct030RequestQuery,
  ApiAct030ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  summary: "ACT-030: 신규등록용 활동보고서의 활동반기를 조회합니다.",
  description: `
  # ACT-030

  신규등록용 활동보고서의 활동 기간 입력 범위로 사용할 신규등록용 활동반기를 조회합니다.
  `,
  responses: {
    200: {
      description: "성공적으로 신규등록용 활동반기를 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
