import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zMemberRegistration } from "@clubs/domain/registration/member-registration";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zDivision } from "@clubs/interface/api/division/type/division.type";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { registry } from "@clubs/interface/open-api";

const url = () => `/student/registrations/member-registrations/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    applies: z.array(
      z.object({
        id: zMemberRegistration.shape.id,
        clubId: zClub.shape.id,
        clubNameKr: zClub.shape.nameKr,
        type: z.nativeEnum(ClubTypeEnum), // 동아리 유형(정동아리 | 가동아리)
        isPermanent: z.coerce.boolean(), // 상임동아리 여부
        divisionName: zDivision.shape.name,
        applyStatusEnumId:
          zMemberRegistration.shape.registrationApplicationStudentEnum,
      }),
    ),
  }),
  [HttpStatusCode.NoContent]: z.object({
    applies: z.array(
      z.object({
        id: zMemberRegistration.shape.id,
        clubId: zClub.shape.id,
        clubNameKr: zClub.shape.nameKr,
        type: zClub.shape.typeEnum, // 동아리 유형(정동아리 | 가동아리)
        isPermanent: z.coerce.boolean(), // 상임동아리 여부
        divisionName: zDivision.shape.name,
        applyStatusEnumId:
          zMemberRegistration.shape.registrationApplicationStudentEnum,
      }),
    ),
  }),
};

const responseErrorMap = {};

registry.registerPath({
  tags: ["member-registration"],
  method: "get",
  path: url(),
  description: `
  # REG-006

  자신의 동아리 신청 내역과 그 상태를 전부 조회합니다.
  `,
  summary: "REG-006: 학생이 자신의 동아리 신청 내역을 조회합니다.",
  responses: {
    200: {
      description: "성공적으로 신청 내역을 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
    204: {
      description: "신청 내역이 없습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[204],
        },
      },
    },
  },
});

const apiReg006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg006RequestParam = z.infer<typeof apiReg006.requestParam>;
type ApiReg006RequestQuery = z.infer<typeof apiReg006.requestQuery>;
type ApiReg006RequestBody = z.infer<typeof apiReg006.requestBody>;
type ApiReg006ResponseOk = z.infer<(typeof apiReg006.responseBodyMap)[200]>;
type ApiReg006ResponseNoContent = z.infer<
  (typeof apiReg006.responseBodyMap)[204]
>;

export default apiReg006;

export type {
  ApiReg006RequestParam,
  ApiReg006RequestQuery,
  ApiReg006RequestBody,
  ApiReg006ResponseOk,
  ApiReg006ResponseNoContent,
};
