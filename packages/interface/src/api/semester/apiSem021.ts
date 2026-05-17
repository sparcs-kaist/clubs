import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFundingDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 지원금 신청 기간의 시작/종료일을 수정합니다.
 */

const url = (fundingDeadlineId: number) =>
  `/executive/semesters/funding-deadlines/${fundingDeadlineId}`;
const method = "PUT";

const requestParam = z.object({
  fundingDeadlineId: zFundingDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  startTerm: zFundingDeadline.shape.startTerm,
  endTerm: zFundingDeadline.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zFundingDeadline.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem021 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem021RequestParam = z.infer<typeof apiSem021.requestParam>;
type ApiSem021RequestQuery = z.infer<typeof apiSem021.requestQuery>;
type ApiSem021RequestBody = z.infer<typeof apiSem021.requestBody>;
type ApiSem021ResponseOk = z.infer<(typeof apiSem021.responseBodyMap)[200]>;

export type {
  ApiSem021RequestParam,
  ApiSem021RequestQuery,
  ApiSem021RequestBody,
  ApiSem021ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters/funding-deadlines/{fundingDeadlineId}",
  summary: "SEM-021: 지원금 신청 기간 수정하기",
  description: `
  지원금 신청 기간의 시작/종료일을 수정합니다.
  1. fundingDeadlineId를 request parameter로 받습니다.
  2. 시작일은 종료일과 같을 수 있으며, 종료일보다 이후일 수 없습니다.
  3. 같은 학기의 다른 지원금 신청 기간과 기간이 겹쳐도 수정할 수 있습니다.
  `,
  request: {
    params: apiSem021.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiSem021.requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "지원금 신청 기간이 수정되었습니다.",
      content: {
        "application/json": {
          schema: apiSem021.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    404: {
      description: "해당 지원금 신청 기간을 찾을 수 없습니다.",
    },
  },
});
