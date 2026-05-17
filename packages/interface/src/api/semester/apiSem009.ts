import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 활동보고서 제출 기한의 시작/종료일을 수정합니다.
 */

const url = (deadlineId: number) =>
  `/executive/semesters/activity-deadlines/${deadlineId}`;
const method = "PUT";

const requestParam = z.object({
  deadlineId: zActivityDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  startTerm: zActivityDeadline.shape.startTerm,
  endTerm: zActivityDeadline.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zActivityDeadline.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem009RequestParam = z.infer<typeof apiSem009.requestParam>;
type ApiSem009RequestQuery = z.infer<typeof apiSem009.requestQuery>;
type ApiSem009RequestBody = z.infer<typeof apiSem009.requestBody>;
type ApiSem009ResponseOk = z.infer<(typeof apiSem009.responseBodyMap)[200]>;

export type {
  ApiSem009RequestParam,
  ApiSem009RequestQuery,
  ApiSem009RequestBody,
  ApiSem009ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters/activity-deadlines/{deadlineId}",
  summary: "SEM-009: 특정 활동보고서 제출 기한 수정하기",
  description: `
  특정 활동보고서 제출 기한의 시작/종료일을 수정합니다.
  1. deadlineId를 request parameter로 받습니다.
  2. 시작일은 종료일과 같을 수 있으며, 종료일보다 이후일 수 없습니다.
  3. 같은 학기의 다른 활동보고서 제출 기한과 기간이 겹쳐도 수정할 수 있습니다.
  `,
  request: {
    params: apiSem009.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiSem009.requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "활동보고서 제출 기한이 수정되었습니다.",
      content: {
        "application/json": {
          schema: apiSem009.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    404: {
      description: "해당 활동보고서 제출 기한을 찾을 수 없습니다.",
    },
  },
});
