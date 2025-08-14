import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zOperationCommitteeKey } from "@clubs/domain/operation-committee/operation-committeekey";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 운영위원 비밀키 조회합니다.
 */

const url = () => `/executive/operation-committees/secret-key`;
const method = "GET";

const requestParam = z.object({});
const requestQuery = z.object({});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    message: z.string(),
    activeKey: z.array(zOperationCommitteeKey),
  }),
};

const responseErrorMap = {};

export const apiOpC002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiOpC002RequestParam = z.infer<typeof apiOpC002.requestParam>;
type ApiOpC002RequestQuery = z.infer<typeof apiOpC002.requestQuery>;
type ApiOpC002RequestBody = z.infer<typeof apiOpC002.requestBody>;
type ApiOpC002ResponseOK = z.infer<(typeof apiOpC002.responseBodyMap)[200]>;

export type {
  ApiOpC002RequestParam,
  ApiOpC002RequestQuery,
  ApiOpC002RequestBody,
  ApiOpC002ResponseOK,
};

registry.registerPath({
  tags: ["operation-committee"],
  method: "get",
  path: "/executive/operation-committees/secret-key",
  summary: "OPC-002: 운영위원 비밀키 조회하기",
  description: "현재 활성화된 운영위원 비밀키를 조회합니다.",
  responses: {
    200: {
      description: "성공적으로 활성 비밀키 조회했습니다.",
      content: {
        "application/json": {
          schema: apiOpC002.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    404: {
      description: "활성화된 비밀키를 찾을 수 없습니다.",
    },
  },
});
