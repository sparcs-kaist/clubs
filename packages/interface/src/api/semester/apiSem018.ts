import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zRegistrationDeadline } from "@clubs/domain/semester/deadline";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리 등록 기간을 추가합니다.
 */

const url = `/executive/semesters/registration-deadlines`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  semesterId: zSemester.shape.id,
  deadlineEnum: zRegistrationDeadline.shape.deadlineEnum,
  startTerm: zRegistrationDeadline.shape.startTerm,
  endTerm: zRegistrationDeadline.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

export const apiSem018 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem018RequestParam = z.infer<typeof apiSem018.requestParam>;
type ApiSem018RequestQuery = z.infer<typeof apiSem018.requestQuery>;
type ApiSem018RequestBody = z.infer<typeof apiSem018.requestBody>;
type ApiSem018ResponseCreated = z.infer<
  (typeof apiSem018.responseBodyMap)[201]
>;

export type {
  ApiSem018RequestParam,
  ApiSem018RequestQuery,
  ApiSem018RequestBody,
  ApiSem018ResponseCreated,
};

registry.registerPath({
  tags: ["semester"],
  method: "post",
  path: "/executive/semesters/registration-deadlines",
  summary: "SEM-018: 등록 기간 추가하기",
  description: `
  등록 기간을 추가합니다.
  1. 대상 학기는 semesterId로 식별합니다.
  2. 시작일과 종료일이 포함되어야 합니다.
  3. 시작일은 종료일보다 이전이어야 합니다.
  4. 동일 학기에 대해서 같은 종류의 기간은 겹치지 않아야 합니다.
  `,
  request: {
    body: {
      content: {
        "application/json": {
          schema: apiSem018.requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "등록 기간이 추가되었습니다.",
      content: {
        "application/json": {
          schema: apiSem018.responseBodyMap[HttpStatusCode.Created],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    404: {
      description: "해당 학기를 찾을 수 없습니다.",
    },
  },
});
