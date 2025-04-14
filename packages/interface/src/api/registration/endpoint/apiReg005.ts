import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { registry } from "@clubs/interface/open-api";

const url = () =>
  `/student/registrations/member-registrations/member-registration`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: zClub.shape.id,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

registry.registerPath({
  tags: ["member-registration"],
  method: "post",
  path: url(),
  description: `
  # REG-005

  동아리 가입을 신청합니다.

  이미 동아리 회원이거나(신청 대표자), 이미 가입한 경우 400 에러를 반환합니다.
  `,
  summary: "REG-005: 학생이 동아리 가입 신청을 생성합니다.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공적으로 신청이 등록되었습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});

const apiReg005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg005RequestParam = z.infer<typeof apiReg005.requestParam>;
type ApiReg005RequestQuery = z.infer<typeof apiReg005.requestQuery>;
type ApiReg005RequestBody = z.infer<typeof apiReg005.requestBody>;
type ApiReg005ResponseCreated = z.infer<
  (typeof apiReg005.responseBodyMap)[201]
>;

export default apiReg005;

export type {
  ApiReg005RequestParam,
  ApiReg005RequestQuery,
  ApiReg005RequestBody,
  ApiReg005ResponseCreated,
};
