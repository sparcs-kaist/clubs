import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zFundingDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 지원금 신청 기간을 추가합니다.
 */

const url = `/executive/semesters/funding-deadlines`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  activityDId: zActivityDuration.shape.id,
  deadlineEnum: zFundingDeadline.shape.deadlineEnum,
  startTerm: zFundingDeadline.shape.startTerm,
  endTerm: zFundingDeadline.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

export const apiSem015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem015RequestParam = z.infer<typeof apiSem015.requestParam>;
type ApiSem015RequestQuery = z.infer<typeof apiSem015.requestQuery>;
type ApiSem015RequestBody = z.infer<typeof apiSem015.requestBody>;
type ApiSem015ResponseCreated = z.infer<
  (typeof apiSem015.responseBodyMap)[201]
>;

export type {
  ApiSem015RequestParam,
  ApiSem015RequestQuery,
  ApiSem015RequestBody,
  ApiSem015ResponseCreated,
};

registry.registerPath({
  tags: ["semester"],
  method: "post",
  path: "/executive/semesters/funding-deadlines",
  summary: "SEM-015: 지원금 신청 기간 추가하기",
  description: `
  지원금 신청 기간을 추가합니다.
  1. 대상 활동 기간은 activityDId로 식별합니다.
  2. 시작일과 종료일이 포함되어야 합니다.
  3. 시작일은 종료일보다 이전이어야 합니다.
  4. 동일 학기에 대해서 기간은 겹치지 않아야 합니다.
  `,
  request: {
    body: {
      content: {
        "application/json": {
          schema: apiSem015.requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "지원금 신청 기간이 추가되었습니다.",
      content: {
        "application/json": {
          schema: apiSem015.responseBodyMap[HttpStatusCode.Created],
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
