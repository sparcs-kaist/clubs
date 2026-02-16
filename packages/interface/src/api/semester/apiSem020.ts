import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zRegistrationDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 등록 기간을 삭제합니다.
 */

const url = (registrationDeadlineId: number) =>
  `/executive/semesters/registration-deadlines/${registrationDeadlineId}`;
const method = "DELETE";

const requestParam = z.object({
  registrationDeadlineId: zRegistrationDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

export const apiSem020 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem020RequestParam = z.infer<typeof apiSem020.requestParam>;
type ApiSem020RequestQuery = z.infer<typeof apiSem020.requestQuery>;
type ApiSem020RequestBody = z.infer<typeof apiSem020.requestBody>;
type ApiSem020ResponseOk = z.infer<(typeof apiSem020.responseBodyMap)[200]>;

export type {
  ApiSem020RequestParam,
  ApiSem020RequestQuery,
  ApiSem020RequestBody,
  ApiSem020ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "delete",
  path: "/executive/semesters/registration-deadlines/{registrationDeadlineId}",
  summary: "SEM-020: 등록 기간 삭제하기",
  description: `
  등록 기간을 삭제합니다.
  1. registrationDeadlineId를 request parameter로 받습니다.
  2. 해당 기간이 존재하지 않으면 404 에러를 반환합니다.
  `,
  request: {
    params: apiSem020.requestParam,
  },
  responses: {
    200: {
      description: "등록 기간이 삭제되었습니다.",
      content: {
        "application/json": {
          schema: apiSem020.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    404: {
      description: "해당 등록 기간을 찾을 수 없습니다.",
    },
  },
});
