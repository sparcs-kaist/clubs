import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegateChangeRequest } from "@clubs/domain/club/club-delegate-change-request";
import { zStudent } from "@clubs/domain/user/student";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 마이페이지에서 나에게 신청한 대표자 변경을 조회합니다.
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
        id: z.coerce.number().int().min(1),
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
  summary: "CLB-013: 마이페이지에서 나에게 신청한 대표자 변경을 조회합니다",
  description: `# CLB-013

마이페이지에서 나에게 신청한 대표자 변경을 조회합니다.

학생으로 로그인되어 있어야 합니다.

다른 동아리 대표자가 나를 새로운 대표자로 지정한 변경 신청들을 조회할 수 있습니다.
신청 상태(대기/승인/거절)도 함께 확인할 수 있습니다.
  `,
  request: {},
  responses: {
    200: {
      description: "성공적으로 나에게 신청한 대표자 변경 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
