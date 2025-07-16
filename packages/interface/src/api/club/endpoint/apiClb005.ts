import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 기본 정보를 수정합니다
 */

const url = (clubId: number) => `/student/clubs/club/${clubId}/brief`;
const method = "PUT";

const requestParam = z.object({
  clubId: zClub.shape.id, // clubId는 정수형 숫자
});

const requestQuery = z.object({});

const requestBody = z.object({
  description: zClub.shape.description,
  roomPassword: z.coerce.string().max(20),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

type ApiClb005RequestParam = z.infer<typeof apiClb005.requestParam>;
type ApiClb005RequestQuery = z.infer<typeof apiClb005.requestQuery>;
type ApiClb005RequestBody = z.infer<typeof apiClb005.requestBody>;
type ApiClb005ResponseOk = z.infer<(typeof apiClb005.responseBodyMap)[200]>;

const apiClb005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb005;

export type {
  ApiClb005RequestParam,
  ApiClb005RequestQuery,
  ApiClb005RequestBody,
  ApiClb005ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "put",
  path: "/student/clubs/club/:clubId/brief",
  summary: "CLB-005: 동아리의 기본 정보를 수정합니다",
  description: `# CLB-005

동아리의 기본 정보를 수정합니다.

동아리 대표자로 로그인되어 있어야 합니다.

동아리 설명과 동아리방 비밀번호를 수정할 수 있습니다.
  `,
  request: {
    params: requestParam,
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공적으로 동아리 기본 정보를 수정했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
