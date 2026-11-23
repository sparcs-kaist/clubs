import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegateChangeRequest } from "@clubs/domain/club/club-delegate-change-request";
import { zStudent } from "@clubs/domain/user/student";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 대표자 및 대의원 변경 요청을 조회합니다.
 */

const url = (clubId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate/requests`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    requests: z
      .object({
        id: zClubDelegateChangeRequest.shape.id,
        delegateEnumId: zClubDelegateChangeRequest.shape.clubDelegateEnumId,
        studentId: zStudent.shape.id,
        studentNumber: z.coerce.number().int().min(20000000).max(30000000),
        studentName: zStudent.shape.name,
        clubDelegateChangeRequestStatusEnumId:
          zClubDelegateChangeRequest.shape.clubDelegateChangeRequestStatusEnum,
        isCanceled: z.boolean(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb011 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb011RequestParam = z.infer<typeof apiClb011.requestParam>;
type ApiClb011RequestQuery = z.infer<typeof apiClb011.requestQuery>;
type ApiClb011RequestBody = z.infer<typeof apiClb011.requestBody>;
type ApiClb011ResponseOk = z.infer<(typeof apiClb011.responseBodyMap)[200]>;

export default apiClb011;

export type {
  ApiClb011RequestParam,
  ApiClb011RequestQuery,
  ApiClb011RequestBody,
  ApiClb011ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/club/:clubId/delegates/delegate/requests",
  summary: "CLB-011: 동아리 대표자 및 대의원 변경 요청 조회",
  description: `# CLB-011

직책별 최신 변경 요청을 최대 한 건씩 조회합니다.
취소된 최신 요청은 isCanceled가 true이며 기존 요청 상태 값은 유지됩니다.
최신 요청이 만료된 대기 요청이면 해당 직책은 반환하지 않으며, 이전 요청으로 대체하지 않습니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "동아리 대표자 및 대의원 변경 요청을 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
