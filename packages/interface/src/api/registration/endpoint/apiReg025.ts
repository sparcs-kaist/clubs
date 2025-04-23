import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubSummaryResponse } from "@clubs/interface/api/club/type/club.type";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

/**
 * @version v0.1
 * @description 학생이 자신이 등록 신청이 가능한 동아리의 목록 및 현황을 조회합니다.
 * availableClub이 null: 신규 가등록만 가능
 * availableClub이 있는 경우: 해당 availableRegistrationTypeEnums에 가능한 타입 명시
 * 이미 등록 신청을 한 경우: availableRegistrationTypeEnums가 []
 */

const url = () => `/student/registrations/available-clubs`;
export const ApiReg025RequestUrl = `/student/registrations/available-clubs`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    club: zClubSummaryResponse
      .extend({
        availableRegistrationTypeEnums: z.array(
          z.nativeEnum(RegistrationTypeEnum),
        ),
      })
      .nullable(),
  }),
};

const responseErrorMap = {};

const apiReg025 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg025RequestParam = z.infer<typeof apiReg025.requestParam>;
type ApiReg025RequestQuery = z.infer<typeof apiReg025.requestQuery>;
type ApiReg025RequestBody = z.infer<typeof apiReg025.requestBody>;
type ApiReg025ResponseOk = z.infer<(typeof apiReg025.responseBodyMap)[200]>;

export default apiReg025;

export type {
  ApiReg025RequestParam,
  ApiReg025RequestQuery,
  ApiReg025RequestBody,
  ApiReg025ResponseOk,
};
