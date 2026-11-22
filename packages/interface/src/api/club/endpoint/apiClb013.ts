import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegateChangeRequest } from "@clubs/domain/club/club-delegate-change-request";
import { zStudent } from "@clubs/domain/user/student";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 마이페이지에서 내가 받은 대표자 및 대의원 변경 요청을 조회합니다.
 */

const url = () => `/student/clubs/delegates/requests`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    requests: z
      .object({
        id: zClubDelegateChangeRequest.shape.id,
        delegateEnumId: zClubDelegateChangeRequest.shape.clubDelegateEnumId,
        prevStudentId: zStudent.shape.id,
        prevStudentNumber: z.coerce.number().int().min(20000000).max(30000000),
        prevStudentName: zStudent.shape.name,
        clubId: zClub.shape.id,
        clubName: zClub.shape.nameKr,
        clubDelegateChangeRequestStatusEnumId:
          zClubDelegateChangeRequest.shape.clubDelegateChangeRequestStatusEnum,
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb013RequestParam = z.infer<typeof apiClb013.requestParam>;
type ApiClb013RequestQuery = z.infer<typeof apiClb013.requestQuery>;
type ApiClb013RequestBody = z.infer<typeof apiClb013.requestBody>;
type ApiClb013ResponseOk = z.infer<(typeof apiClb013.responseBodyMap)[200]>;

export default apiClb013;

export type {
  ApiClb013RequestParam,
  ApiClb013RequestQuery,
  ApiClb013RequestBody,
  ApiClb013ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/delegates/requests",
  summary: "CLB-013: 마이페이지에서 받은 대표자 및 대의원 변경 요청 조회",
  description: `# CLB-013

학생으로 로그인되어 있어야 합니다.

나를 대표자 또는 대의원으로 지정한 대기 중인 변경 요청을 조회합니다.
  `,
  request: {},
  responses: {
    200: {
      description: "내가 받은 대표자 및 대의원 변경 요청을 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
