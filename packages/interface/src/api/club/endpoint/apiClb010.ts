import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zSemester } from "@clubs/domain/semester/semester";
import { zStudent } from "@clubs/domain/user/student";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";
import { registry } from "@clubs/interface/open-api";
/**
 * @version v0.1
 * @description semesterId에 해당하는 학기에 clubId의 동아리에서 활동한 모든 회원 정보를 가져옵니다.
 */

const url = (clubId: number, semesterId: number) =>
  `/student/clubs/club/${clubId}/members/semesters/semester/${semesterId}`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
  semesterId: zSemester.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    members: z
      .object({
        name: zStudent.shape.name,
        studentId: zStudent.shape.id,
        studentNumber: z.coerce.number().int().min(20000000).max(30000000),
        email: zStudent.shape.email,
        phoneNumber: zKrPhoneNumber.optional(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb010 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb010RequestParam = z.infer<typeof apiClb010.requestParam>;
type ApiClb010RequestQuery = z.infer<typeof apiClb010.requestQuery>;
type ApiClb010RequestBody = z.infer<typeof apiClb010.requestBody>;
type ApiClb010ResponseOk = z.infer<(typeof apiClb010.responseBodyMap)[200]>;

export default apiClb010;

export type {
  ApiClb010RequestParam,
  ApiClb010RequestQuery,
  ApiClb010RequestBody,
  ApiClb010ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/club/:clubId/members/semesters/semester/{semesterId}",
  summary: "CLB-010: 특정 학기에 동아리에서 활동한 모든 회원 정보를 가져옵니다",
  description: `# CLB-010

semesterId에 해당하는 학기에 clubId의 동아리에서 활동한 모든 회원 정보를 가져옵니다.

동아리 대표자로 로그인되어 있어야 합니다.

해당 학기에 동아리에서 활동한 모든 회원의 학번, 이름, 이메일, 전화번호 정보를 조회할 수 있습니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 해당 학기 동아리 회원 정보를 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
