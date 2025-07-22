import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegate } from "@clubs/domain/club/club-delegate";
import { zStudent } from "@clubs/domain/user/student";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";
import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 대표자 및 대의원 변경을 위한 목록을 가져옵니다.
 */

const url = (clubId: number, delegateEnumId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate/${delegateEnumId}/candidates`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
  delegateEnumId: zClubDelegate.shape.clubDelegateEnum,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    students: z.array(
      z.object({
        id: zStudent.shape.id,
        studentNumber: zStudent.shape.studentNumber,
        name: zStudent.shape.name,
        phoneNumber: zKrPhoneNumber,
      }),
    ),
  }),
};

const responseErrorMap = {};

type ApiClb008RequestParam = z.infer<typeof apiClb008.requestParam>;
type ApiClb008RequestQuery = z.infer<typeof apiClb008.requestQuery>;
type ApiClb008RequestBody = z.infer<typeof apiClb008.requestBody>;
type ApiClb008ResponseOk = z.infer<(typeof apiClb008.responseBodyMap)[200]>;

const apiClb008 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb008;

export type {
  ApiClb008RequestParam,
  ApiClb008RequestQuery,
  ApiClb008RequestBody,
  ApiClb008ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/club/:clubId/delegates/delegate/{delegateEnumId}/candidates",
  summary: "CLB-008: 동아리의 대표자 및 대의원 변경을 위한 목록을 가져옵니다",
  description: `# CLB-008

동아리의 대표자 및 대의원 변경을 위한 목록을 가져옵니다.

동아리 대표자로 로그인되어 있어야 합니다.

해당 동아리의 현재 학기 회원 중에서 대표자나 대의원으로 변경 가능한 학생들의 목록을 반환합니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 대표자 및 대의원 변경 후보 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
