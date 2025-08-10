import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 활동 기간에 활동 보고서 제출 기한을 추가합니다.
 */

const url = () => `/executive/semesters/activity-deadlines`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  activityDId: z.coerce.number().int().positive(),
  deadlineEnum: zActivityDeadline.shape.deadlineEnum,
  startTerm: zActivityDeadline.shape.startTerm,
  endTerm: zActivityDeadline.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

export const apiSem006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem006RequestParam = z.infer<typeof apiSem006.requestParam>;
type ApiSem006RequestQuery = z.infer<typeof apiSem006.requestQuery>;
type ApiSem006RequestBody = z.infer<typeof apiSem006.requestBody>;
type ApiSem006ResponseCreated = z.infer<
  (typeof apiSem006.responseBodyMap)[201]
>;

export type {
  ApiSem006RequestParam,
  ApiSem006RequestQuery,
  ApiSem006RequestBody,
  ApiSem006ResponseCreated,
};

registry.registerPath({
  tags: ["semester"],
  method: "post",
  path: "/executive/semesters/activity-deadlines",
  summary: "SEM-006: 활동 보고서 제출 기한 추가",
  description: `
  특정 활동 기간에 활동 보고서 제출 기한을 추가합니다.
  1. 대상 활동 기간은 activityDId로 식별합니다.
  2. 시작일은 종료일보다 이전이어야 합니다.
  3. 기간은 겹치지 않아야 합니다.
  `,
  request: {
    body: {
      content: {
        "application/json": {
          schema: apiSem006.requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공적으로 활동 보고서 제출 기한을 추가했습니다.",
      content: {
        "application/json": {
          schema: apiSem006.responseBodyMap[HttpStatusCode.Created],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    404: {
      description: "해당 활동 기간을 찾을 수 없습니다.",
    },
  },
});
