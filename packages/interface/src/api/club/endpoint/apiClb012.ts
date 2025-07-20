import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 현재 신청된 대표자 변경을 취소합니다.
 */

const url = (clubId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate/requests`;
const method = "DELETE";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

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
  summary: "CLB-012: 동아리의 현재 신청된 대표자 변경을 취소합니다",
  description: `# CLB-012

동아리의 현재 신청된 대표자 변경을 취소합니다.

동아리 대표자로 로그인되어 있어야 합니다.

현재 진행 중인 대표자 변경 신청을 취소할 수 있습니다.
승인이나 거절된 신청은 취소할 수 없습니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    201: {
      description: "성공적으로 대표자 변경 신청을 취소했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});
