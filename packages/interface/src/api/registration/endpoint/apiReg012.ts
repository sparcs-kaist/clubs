import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zClubName } from "@clubs/interface/common/commonString";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

/**
 * @version v0.2
 * @description 자신이 관리하는 동아리의 동아리 등록 목록을 조회합니다.
 */

const url = () => `/student/registrations/club-registrations/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    registrations: z.array(
      z.object({
        // 나중에 registrationSummaryResponse로 변경 필요
        id: z.coerce.number().int().min(1),
        registrationStatusEnum: z.nativeEnum(RegistrationStatusEnum),
        registrationTypeEnum: z.nativeEnum(RegistrationTypeEnum),
        divisionName: z.string().max(128),
        clubNameKr: zClubName.optional(),
        newClubNameKr: zClubName,
        clubNameEn: zClubName.optional(),
        newClubNameEn: zClubName,
        clubId: zClub.pick({ id: true }).shape.id,
        activityFieldKr: z.string().max(255),
        activityFieldEn: z.string().max(255),
        professorName: z.string().max(255),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiReg012 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg012RequestParam = z.infer<typeof apiReg012.requestParam>;
type ApiReg012RequestQuery = z.infer<typeof apiReg012.requestQuery>;
type ApiReg012RequestBody = z.infer<typeof apiReg012.requestBody>;
type ApiReg012ResponseOk = z.infer<(typeof apiReg012.responseBodyMap)[200]>;

export default apiReg012;

export type {
  ApiReg012RequestParam,
  ApiReg012RequestQuery,
  ApiReg012RequestBody,
  ApiReg012ResponseOk,
};
