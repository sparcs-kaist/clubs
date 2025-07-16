import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegateChangeRequest } from "@clubs/domain/club/club-delegate-change-request";
import { zStudent } from "@clubs/domain/user/student";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 현재 신청된 대표자 변경을 조회합니다.
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
        studentId: zStudent.shape.id,
        studentNumber: z.coerce.number().int().min(20000000).max(30000000),
        studentName: zStudent.shape.name,
        clubDelegateChangeRequestStatusEnumId:
          zClubDelegateChangeRequest.shape.clubDelegateChangeRequestStatusEnum,
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
  summary: "CLB-011: 학생용 동아리 대표자 변경 신청 조회",
  description: `# CLB-011

동아리의 현재 신청된 대표자 변경을 조회합니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "동아리 대표자 변경 신청 조회 성공",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
