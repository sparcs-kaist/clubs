import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFundingDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 지원금 신청 기간을 삭제합니다.
 */

const url = (fundingDeadlineId: number) =>
  `/executive/semesters/funding-deadlines/${fundingDeadlineId}`;
const method = "DELETE";

const requestParam = z.object({
  fundingDeadlineId: zFundingDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

export const apiSem017 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem017RequestParam = z.infer<typeof apiSem017.requestParam>;
type ApiSem017RequestQuery = z.infer<typeof apiSem017.requestQuery>;
type ApiSem017RequestBody = z.infer<typeof apiSem017.requestBody>;
type ApiSem017ResponseOk = z.infer<(typeof apiSem017.responseBodyMap)[200]>;

export type {
  ApiSem017RequestParam,
  ApiSem017RequestQuery,
  ApiSem017RequestBody,
  ApiSem017ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "delete",
  path: "/executive/semesters/funding-deadlines/{fundingDeadlineId}",
  summary: "SEM-017: 지원금 신청 기간 삭제하기",
  description: `
  지원금 신청 기간을 삭제합니다.
  1. fundingDeadlineId를 request parameter로 받습니다.
  2. 해당 기간이 존재하지 않으면 404 에러를 반환합니다.
  `,
  request: {
    params: apiSem017.requestParam,
  },
  responses: {
    200: {
      description: "지원금 신청 기간이 삭제되었습니다.",
      content: {
        "application/json": {
          schema: apiSem017.responseBodyMap[HttpStatusCode.Ok],
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
