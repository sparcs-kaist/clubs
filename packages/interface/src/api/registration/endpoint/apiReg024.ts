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

const url = () => `/student/registrations/club-registrations`;
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

const apiReg024 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg024RequestParam = z.infer<typeof apiReg024.requestParam>;
type ApiReg024RequestQuery = z.infer<typeof apiReg024.requestQuery>;
type ApiReg024RequestBody = z.infer<typeof apiReg024.requestBody>;
type ApiReg024ResponseOk = z.infer<(typeof apiReg024.responseBodyMap)[200]>;

export default apiReg024;

export type {
  ApiReg024RequestParam,
  ApiReg024RequestQuery,
  ApiReg024RequestBody,
  ApiReg024ResponseOk,
};
