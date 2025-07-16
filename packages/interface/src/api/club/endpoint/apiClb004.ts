import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 기본 정보를 가져옵니다
 */

const url = (clubId: number) => `/student/clubs/club/${clubId}/brief`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    description: zClub.shape.description,
    roomPassword: z.string().max(20),
  }),
};

const responseErrorMap = {};

type ApiClb004RequestParam = z.infer<typeof apiClb004.requestParam>;
type ApiClb004RequestQuery = z.infer<typeof apiClb004.requestQuery>;
type ApiClb004RequestBody = z.infer<typeof apiClb004.requestBody>;
type ApiClb004ResponseOK = z.infer<(typeof apiClb004.responseBodyMap)[200]>;

const apiClb004 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb004;

export type {
  ApiClb004RequestParam,
  ApiClb004RequestQuery,
  ApiClb004RequestBody,
  ApiClb004ResponseOK,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/club/{clubId}/brief",
  summary: "CLB-004: 동아리의 기본 정보를 가져옵니다",
  description: `# CLB-004

동아리의 기본 정보를 가져옵니다.

동아리 대표자로 로그인되어 있어야 합니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 동아리 기본 정보를 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
