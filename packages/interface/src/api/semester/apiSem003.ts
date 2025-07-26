import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

const url = () => `/executive/semesters`;
const method = "PUT";

const requestParam = z.object({});

const requestQuery = z.object({
  name: zSemester.shape.name,
  year: zSemester.shape.year,
});

const requestBody = z.object({
  startTerm: zSemester.shape.startTerm,
  endTerm: zSemester.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zSemester.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem003RequestParam = z.infer<typeof apiSem003.requestParam>;
type ApiSem003RequestQuery = z.infer<typeof apiSem003.requestQuery>;
type ApiSem003RequestBody = z.infer<typeof apiSem003.requestBody>;
type ApiSem003ResponseOk = z.infer<(typeof apiSem003.responseBodyMap)[200]>;

export type {
  ApiSem003RequestParam,
  ApiSem003RequestQuery,
  ApiSem003RequestBody,
  ApiSem003ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters",
  summary: "SEM-003: 학기 기간 수정하기",
  description: `
  학기 기간을 수정합니다. 학기는 년도 이름, 시작/종료일로 구성되어 있습니다.
  1. (학기, 년도) 쌍은 유일해야 합니다.
  2. 모든 학기는 시작일이 종료일보다 이전이어야 합니다.
  3. 시작일은 포함하고 종료일은 포함하지 않습니다.
  4. 모든 기간은 겹치면 안 됩니다.
  `,
  request: {
    query: apiSem003.requestQuery,
    body: {
      content: {
        "application/json": {
          schema: apiSem003.requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공적으로 학기를 수정했습니다.",
      content: {
        "application/json": {
          schema: apiSem003.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
