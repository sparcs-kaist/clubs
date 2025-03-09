import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zDivision } from "@sparcs-clubs/interface/api/division/type/division.type";

/**
 * @version v0.1
 * @description 동아리별 회원 등록 신청의 간략한 상태를 확인합니다.
 */

const url = () => `/executive/registrations/member-registrations/brief`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        clubId: zClub.shape.id,
        clubTypeEnumId: zClub.shape.typeEnum,
        isPermanent: z.coerce.boolean(),
        division: z.object({
          id: zDivision.shape.id,
          name: zDivision.shape.name,
        }),
        clubName: zClub.shape.nameKr,
        totalRegistrations: z.coerce.number().int().min(0),
        regularMemberRegistrations: z.coerce.number().int().min(0),
        totalApprovals: z.coerce.number().int().min(0),
        regularMemberApprovals: z.coerce.number().int().min(0),
      }),
    ),
    total: z.coerce.number().min(1),
    offset: z.coerce.number().min(1),
  }),
};

const responseErrorMap = {};

const apiReg019 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg019RequestParam = z.infer<typeof apiReg019.requestParam>;
type ApiReg019RequestQuery = z.infer<typeof apiReg019.requestQuery>;
type ApiReg019RequestBody = z.infer<typeof apiReg019.requestBody>;
type ApiReg019ResponseOk = z.infer<(typeof apiReg019.responseBodyMap)[200]>;

export default apiReg019;

export type {
  ApiReg019RequestParam,
  ApiReg019RequestQuery,
  ApiReg019RequestBody,
  ApiReg019ResponseOk,
};
