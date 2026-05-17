import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zRegistrationDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 등록 기간의 시작/종료일을 수정합니다.
 */

const url = (registrationDeadlineId: number) =>
  `/executive/semesters/registration-deadlines/${registrationDeadlineId}`;
const method = "PUT";

const requestParam = z.object({
  registrationDeadlineId: zRegistrationDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  startTerm: zRegistrationDeadline.shape.startTerm,
  endTerm: zRegistrationDeadline.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zRegistrationDeadline.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem022 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem022RequestParam = z.infer<typeof apiSem022.requestParam>;
type ApiSem022RequestQuery = z.infer<typeof apiSem022.requestQuery>;
type ApiSem022RequestBody = z.infer<typeof apiSem022.requestBody>;
type ApiSem022ResponseOk = z.infer<(typeof apiSem022.responseBodyMap)[200]>;

export type {
  ApiSem022RequestParam,
  ApiSem022RequestQuery,
  ApiSem022RequestBody,
  ApiSem022ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters/registration-deadlines/{registrationDeadlineId}",
  summary: "SEM-022: 등록 기간 수정하기",
  description: `
  등록 기간의 시작/종료일을 수정합니다.
  1. registrationDeadlineId를 request parameter로 받습니다.
  2. 시작일은 종료일과 같을 수 있으며, 종료일보다 이후일 수 없습니다.
  3. 같은 학기의 다른 등록 기간과 기간이 겹쳐도 수정할 수 있습니다.
  `,
  request: {
    params: apiSem022.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiSem022.requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "등록 기간이 수정되었습니다.",
      content: {
        "application/json": {
          schema: apiSem022.responseBodyMap[HttpStatusCode.Ok],
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
