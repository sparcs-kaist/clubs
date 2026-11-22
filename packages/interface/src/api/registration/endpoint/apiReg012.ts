import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@clubs/domain/semester/semester";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zClubName, zUserName } from "@clubs/interface/common/commonString";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

/**
 * @version v0.2
 * @description 이번 학기 본인 신청 목록 또는 직전 학기 열람 가능한 신청 목록을 조회합니다.
 */

const url = () => `/student/registrations/club-registrations/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({ semester: z.literal("previous").optional() });

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    semester: zSemester.pick({ id: true, name: true, year: true }).optional(),
    registrations: z.array(
      z.object({
        // 나중에 registrationSummaryResponse로 변경 필요
        id: z.coerce.number().int().min(1),
        registrationStatusEnum: z.nativeEnum(RegistrationStatusEnum),
        registrationTypeEnum: z.nativeEnum(RegistrationTypeEnum),
        divisionName: z.string().max(128),
        clubNameKr: zClubName.nullish(),
        newClubNameKr: zClubName,
        clubNameEn: zClubName.nullish(),
        newClubNameEn: zClubName,
        clubId: zClub.shape.id.nullable(),
        activityFieldKr: z.string().max(255),
        activityFieldEn: z.string().max(255),
        professorName: zUserName.nullable(),
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
