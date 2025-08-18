import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

const url = () => `/executive/semesters`;
const method = "DELETE";

const requestParam = z.object({});

const requestQuery = z.object({
  name: zSemester.shape.name,
  year: zSemester.shape.year,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zSemester.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem004 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem004RequestParam = z.infer<typeof apiSem004.requestParam>;
type ApiSem004RequestQuery = z.infer<typeof apiSem004.requestQuery>;
type ApiSem004RequestBody = z.infer<typeof apiSem004.requestBody>;
type ApiSem004ResponseOk = z.infer<(typeof apiSem004.responseBodyMap)[200]>;

export type {
  ApiSem004RequestParam,
  ApiSem004RequestQuery,
  ApiSem004RequestBody,
  ApiSem004ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "delete",
  path: "/executive/semesters",
  summary: "SEM-004: 학기 삭제하기",
  description: `
  학기를 삭제합니다 (soft delete). 학기는 년도와 이름으로 식별됩니다.
  1. 삭제하려는 학기가 존재해야 합니다.
  2. 실제로 데이터를 삭제하지 않고 deletedAt 필드를 설정합니다.
  3. 이미 삭제된 학기는 다시 삭제할 수 없습니다.
  `,
  request: {
    query: apiSem004.requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 학기를 삭제했습니다.",
      content: {
        "application/json": {
          schema: apiSem004.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
