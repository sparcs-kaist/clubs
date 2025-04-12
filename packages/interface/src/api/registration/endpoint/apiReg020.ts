import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zUserName } from "@clubs/interface/common/commonString";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";
import { registry } from "@clubs/interface/open-api";

import { zMemberRegistration } from "../type/member.registration.type";

/**
 * @version v0.1
 * @description 동아리별 가입 신청의 세부 상태를 확인합니다.
 */

const url = () => `/executive/registrations/member-registrations`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zClub.shape.id,
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    totalRegistrations: z.coerce.number().int().min(0),
    totalWaitings: z.coerce.number().int().min(0),
    totalApprovals: z.coerce.number().int().min(0),
    totalRejections: z.coerce.number().int().min(0),
    regularMemberRegistrations: z.coerce.number().int().min(0),
    regularMemberWaitings: z.coerce.number().int().min(0),
    regularMemberApprovals: z.coerce.number().int().min(0),
    regularMemberRejections: z.coerce.number().int().min(0),
    items: z.array(
      z.object({
        memberRegistrationId: zMemberRegistration.shape.id,
        RegistrationApplicationStudentStatusEnumId:
          zMemberRegistration.shape.registrationApplicationStudentEnum,
        isRegularMemberRegistration: z.coerce.boolean(),
        //todo: 엔티티로 바꾸기
        student: z.object({
          id: z.coerce.number().int().min(1),
          studentNumber: z.coerce.number().int().min(1),
          name: zUserName,
          phoneNumber: zKrPhoneNumber.optional(),
          email: z.string().email(),
        }),
      }),
    ),
    total: z.coerce.number().min(1),
    offset: z.coerce.number().min(1),
  }),
};

const responseErrorMap = {};

const apiReg020 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg020RequestParam = z.infer<typeof apiReg020.requestParam>;
type ApiReg020RequestQuery = z.infer<typeof apiReg020.requestQuery>;
type ApiReg020RequestBody = z.infer<typeof apiReg020.requestBody>;
type ApiReg020ResponseOk = z.infer<(typeof apiReg020.responseBodyMap)[200]>;

export default apiReg020;

export type {
  ApiReg020RequestParam,
  ApiReg020RequestQuery,
  ApiReg020RequestBody,
  ApiReg020ResponseOk,
};

registry.registerPath({
  tags: ["member-registration"],
  method: "get",
  path: url(),
  description: `
  # REG-020

  동아리별 가입 신청의 세부 상태를 확인합니다.

  집행부원만 이용 가능합니다.
  `,
  summary: "REG-020: 집행부원이 동아리별 가입 신청의 세부 상태를 확인합니다.",
  request: {
    query: requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 조회되었습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
  },
});
