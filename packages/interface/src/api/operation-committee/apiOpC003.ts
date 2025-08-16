import { HttpStatusCode } from "axios";
import { z } from "zod";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 운영위원 비밀키를 삭제합니다.
 */

const url = () => `/executive/operation-committees/secret-key`;
const method = "DELETE";

const requestParam = z.object({});
const requestQuery = z.object({});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    message: z.string(),
  }),
};

const responseErrorMap = {};

export const apiOpC003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};
type ApiOpC003RequestParam = z.infer<typeof apiOpC003.requestParam>;
type ApiOpC003RequestQuery = z.infer<typeof apiOpC003.requestQuery>;
type ApiOpC003RequestBody = z.infer<typeof apiOpC003.requestBody>;
type ApiOpC003ResponseOK = z.infer<(typeof apiOpC003.responseBodyMap)[200]>;

export type {
  ApiOpC003RequestParam,
  ApiOpC003RequestQuery,
  ApiOpC003RequestBody,
  ApiOpC003ResponseOK,
};

registry.registerPath({
  tags: ["operation-committee"],
  method: "delete",
  path: "/executive/operation-committees/secret-key",
  summary: "OPC-003: 운영위원 비밀키 삭제하기",
  description: `운영위원 비밀키를 삭제합니다.`,
  responses: {
    200: {
      description: "성공적으로 비밀키를 삭제했습니다.",
      content: {
        "application/json": {
          schema: apiOpC003.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
