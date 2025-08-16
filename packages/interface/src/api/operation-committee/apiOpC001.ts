import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zOperationCommitteeKey } from "@clubs/domain/operation-committee/operation-committeekey";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 운영위원 비밀키 생성합니다.
 * - 운영위원 비밀키를 생성합니다.
 * - 비밀키는 10자리 문자열로 구성되어 있습니다.
 * - 현재 활성화된 키가 있을 경우, 새로운 키를 생성하고 이전 키는 비활성화됩니다.
 */

const url = () => `/executive/operation-committees/secret-key`;
const method = "POST";

const requestParam = z.object({});
const requestQuery = z.object({});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({
    message: z.string(),
    createdKey: zOperationCommitteeKey,
  }),
};

const responseErrorMap = {};

export const apiOpC001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiOpC001RequestParam = z.infer<typeof apiOpC001.requestParam>;
type ApiOpC001RequestQuery = z.infer<typeof apiOpC001.requestQuery>;
type ApiOpC001RequestBody = z.infer<typeof apiOpC001.requestBody>;
type ApiOpC001ResponseOK = z.infer<(typeof apiOpC001.responseBodyMap)[201]>;

export type {
  ApiOpC001RequestParam,
  ApiOpC001RequestQuery,
  ApiOpC001RequestBody,
  ApiOpC001ResponseOK,
};

registry.registerPath({
  tags: ["operation-committee"],
  method: "post",
  path: "/executive/operation-committees/secret-key",
  summary: "OPC-001: 운영위원 비밀키 생성하기",
  description: "운영위원 비밀키를 생성합니다.",
  responses: {
    201: {
      description: "성공적으로 비밀키를 생성했습니다.",
      content: {
        "application/json": {
          schema: apiOpC001.responseBodyMap[HttpStatusCode.Created],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
