import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

/**
 * @version v0.1
 * @description 집행부원이 이번 학기 동아리 등록 신청서 목록을 조회합니다.
 */

const url = () => `/executive/registrations/club-registrations`;
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
        id: z.coerce.number().int().min(1),
        registrationTypeEnumId: z.nativeEnum(RegistrationTypeEnum),
        registrationStatusEnumId: z.nativeEnum(RegistrationStatusEnum),
        divisionId: z.coerce.number().int().min(1),
        clubNameKr: zClubName.optional(),
        newClubNameKr: zClubName,
        clubNameEn: zClubName.optional(),
        newClubNameEn: zClubName,
        representativeName: z.string(),
        activityFieldKr: z.string().max(255),
        activityFieldEn: z.string().max(255),
        professorName: z.string().optional(),
      }),
    ),
    total: z.coerce.number().int().min(1),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiReg014 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg014RequestParam = z.infer<typeof apiReg014.requestParam>;
type ApiReg014RequestQuery = z.infer<typeof apiReg014.requestQuery>;
type ApiReg014RequestBody = z.infer<typeof apiReg014.requestBody>;
type ApiReg014ResponseOk = z.infer<(typeof apiReg014.responseBodyMap)[200]>;

export default apiReg014;

export type {
  ApiReg014RequestParam,
  ApiReg014RequestQuery,
  ApiReg014RequestBody,
  ApiReg014ResponseOk,
};
