import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegateChangeRequest } from "@clubs/domain/club/club-delegate-change-request";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 대기 중인 대표자 또는 대의원 변경 요청을 취소합니다.
 */

const url = (clubId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate/requests`;
const method = "DELETE";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({
  requestId: zClubDelegateChangeRequest.shape.id.optional(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiClb012 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb012RequestParam = z.infer<typeof apiClb012.requestParam>;
type ApiClb012RequestQuery = z.infer<typeof apiClb012.requestQuery>;
type ApiClb012RequestBody = z.infer<typeof apiClb012.requestBody>;
type ApiClb012ResponseCreated = z.infer<
  (typeof apiClb012.responseBodyMap)[201]
>;

export default apiClb012;

export type {
  ApiClb012RequestParam,
  ApiClb012RequestQuery,
  ApiClb012RequestBody,
  ApiClb012ResponseCreated,
};

registry.registerPath({
  tags: ["club"],
  method: "delete",
  path: "/student/clubs/club/:clubId/delegates/delegate/requests",
  summary: "CLB-012: 동아리 대표자 및 대의원 변경 요청 취소",
  description: `# CLB-012

동아리 대표자로 로그인되어 있어야 합니다.

requestId에 해당하는 대기 중인 변경 요청을 취소합니다.
requestId를 생략하면 대기 중인 대표자 변경 요청을 취소합니다.
  `,
  request: {
    params: requestParam,
    query: requestQuery,
  },
  responses: {
    201: {
      description: "변경 요청을 취소했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});
