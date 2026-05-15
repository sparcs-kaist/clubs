import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 활동반기의 시작/종료일을 수정합니다.
 */

const url = (activityDurationId: number) =>
  `/executive/semesters/activity-durations/${activityDurationId}`;
const method = "PUT";

const requestParam = z.object({
  activityDurationId: zActivityDuration.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  startTerm: zActivityDuration.shape.startTerm,
  endTerm: zActivityDuration.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zActivityDuration.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem013RequestParam = z.infer<typeof apiSem013.requestParam>;
type ApiSem013RequestQuery = z.infer<typeof apiSem013.requestQuery>;
type ApiSem013RequestBody = z.infer<typeof apiSem013.requestBody>;
type ApiSem013ResponseOk = z.infer<(typeof apiSem013.responseBodyMap)[200]>;

export type {
  ApiSem013RequestParam,
  ApiSem013RequestQuery,
  ApiSem013RequestBody,
  ApiSem013ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters/activity-durations/{activityDurationId}",
  summary: "SEM-013: 활동반기 시작/종료일 수정하기",
  description: `
  활동반기의 시작/종료일을 수정합니다.
  1. 수정하려는 활동반기가 존재해야 합니다.
  2. 시작일은 종료일보다 이전이어야 합니다.
  3. 기존 활동보고서 기간이 수정 후 활동반기 밖으로 벗어나면 수정할 수 없습니다.
  `,
  request: {
    params: apiSem013.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiSem013.requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "활동반기가 수정되었습니다.",
      content: {
        "application/json": {
          schema: apiSem013.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
  },
});
