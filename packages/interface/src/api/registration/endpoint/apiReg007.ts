import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zMemberRegistration } from "@clubs/domain/registration/member-registration";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { registry } from "@clubs/interface/open-api";

const url = (applyId: string) =>
  `/student/registrations/member-registrations/member-registration/${applyId}`;
const method = "PATCH";

const requestParam = z.object({
  applyId: zMemberRegistration.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: zClub.shape.id,
  applyStatusEnumId:
    zMemberRegistration.shape.registrationApplicationStudentEnum,
});

const responseBodyMap = {
  [HttpStatusCode.NoContent]: z.object({}),
};

const responseErrorMap = {};

const apiReg007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg007RequestParam = z.infer<typeof apiReg007.requestParam>;
type ApiReg007RequestQuery = z.infer<typeof apiReg007.requestQuery>;
type ApiReg007RequestBody = z.infer<typeof apiReg007.requestBody>;
type ApiReg007ResponseNoContent = z.infer<
  (typeof apiReg007.responseBodyMap)[204]
>;

export default apiReg007;

export type {
  ApiReg007RequestParam,
  ApiReg007RequestQuery,
  ApiReg007RequestBody,
  ApiReg007ResponseNoContent,
};

registry.registerPath({
  tags: ["member-registration"],
  method: "patch",
  path: url(":applyId"),
  description: `
  # REG-007

  동아리 가입 신청의 상태를 변경합니다.
  `,
  summary: "REG-007: 학생이 동아리 가입 신청의 상태를 변경합니다.",
  request: {
    params: apiReg007.requestParam,
    query: apiReg007.requestQuery,
    body: {
      content: {
        "application/json": {
          schema: apiReg007.requestBody,
        },
      },
    },
  },
  responses: {
    204: {
      description: "성공적으로 가입 신청의 상태가 변경되었습니다.",
      content: {
        "application/json": {
          schema: apiReg007.responseBodyMap[204],
        },
      },
    },
  },
});
