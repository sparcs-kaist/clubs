import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zRegistrationDeadline } from "@clubs/domain/semester/deadline";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 등록 기간 목록을 조회합니다.
 */

const url = `/executive/semesters/registration-deadlines`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  semesterId: zSemester.shape.id.optional(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    deadlines: z.array(
      z.object({
        id: zRegistrationDeadline.shape.id,
        semesterId: zSemester.shape.id,
        deadlineEnum: zRegistrationDeadline.shape.deadlineEnum,
        startTerm: zRegistrationDeadline.shape.startTerm,
        endTerm: zRegistrationDeadline.shape.endTerm,
      }),
    ),
  }),
};

const responseErrorMap = {};

export const apiSem019 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem019RequestParam = z.infer<typeof apiSem019.requestParam>;
type ApiSem019RequestQuery = z.infer<typeof apiSem019.requestQuery>;
type ApiSem019RequestBody = z.infer<typeof apiSem019.requestBody>;
type ApiSem019ResponseOk = z.infer<(typeof apiSem019.responseBodyMap)[200]>;

export type {
  ApiSem019RequestParam,
  ApiSem019RequestQuery,
  ApiSem019RequestBody,
  ApiSem019ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "get",
  path: "/executive/semesters/registration-deadlines",
  summary: "SEM-019: 등록 기간 목록 조회하기",
  description: `
  등록 기간 목록을 조회합니다.
  1. 학기 ID로 특정 학기의 등록 기간을 조회할 수 있습니다.
  2. 페이지네이션 없이 전체를 반환합니다.
  `,
  request: {
    query: apiSem019.requestQuery,
  },
  responses: {
    200: {
      description: "등록 기간이 조회되었습니다.",
      content: {
        "application/json": {
          schema: apiSem019.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
