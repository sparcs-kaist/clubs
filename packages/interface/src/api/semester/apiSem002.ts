import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

const url = () => `/executive/semesters`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  name: zSemester.shape.name,
  year: zSemester.shape.year,
  startTerm: zSemester.shape.startTerm,
  endTerm: zSemester.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({
    id: zSemester.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem002RequestParam = z.infer<typeof apiSem002.requestParam>;
type ApiSem002RequestQuery = z.infer<typeof apiSem002.requestQuery>;
type ApiSem002RequestBody = z.infer<typeof apiSem002.requestBody>;
type ApiSem002ResponseCreated = z.infer<
  (typeof apiSem002.responseBodyMap)[201]
>;

export type {
  ApiSem002RequestParam,
  ApiSem002RequestQuery,
  ApiSem002RequestBody,
  ApiSem002ResponseCreated,
};

registry.registerPath({
  tags: ["semester"],
  method: "post",
  path: "/executive/semesters",
  summary: "SEM-002: 학기 추가하기",
  description: `
  학기를 추가합니다. 학기는 년도 이름, 시작/종료일로 구성되어 있습니다.
  1. (학기, 년도) 쌍은 유일해야 합니다.
  2. 모든 학기는 시작일이 종료일보다 이전이어야 합니다.
  3. 시작일은 포함하고 종료일은 포함하지 않습니다.
  4. 모든 기간은 겹치면 안 됩니다.
  `,
  request: {
    body: {
      content: {
        "application/json": {
          schema: apiSem002.requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공적으로 학기를 추가했습니다.",
      content: {
        "application/json": {
          schema: apiSem002.responseBodyMap[HttpStatusCode.Created],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
