import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName, zUserName } from "@clubs/interface/common/commonString";
import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description  동아리별 가입 신청의 간략한 상태를 확인합니다.
 * - 교수로 로그인되어 있어야 합니다.
 * - 자신을 지도교수로 신청한 동아리 등록 신청만을 조회합니다.
 * - 분과 > 구분 > 동아리 이름 우선순위로 정렬한 목록을 리턴합니다.
 */

const url = () => `/professor/registrations/club-registrations/brief`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        clubId: z.coerce.number().int().min(1),
        registrationStatusEnumId: z.nativeEnum(RegistrationStatusEnum),
        division: z.object({
          id: z.coerce.number().int().min(1),
          name: zUserName,
        }),
        clubNameKr: zClubName.optional(),
        newClubNameKr: zClubName,
        clubNameEn: zClubName.optional(),
        newClubNameEn: zClubName,
        student: z.object({
          id: z.coerce.number().int().min(1),
          studentNumber: z.coerce.number().int().min(1),
          name: zUserName,
          phoneNumber: zKrPhoneNumber.optional(),
          email: z.string(),
        }),
        professorSignedAt: z.coerce.date(),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiReg021 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg021RequestParam = z.infer<typeof apiReg021.requestParam>;
type ApiReg021RequestQuery = z.infer<typeof apiReg021.requestQuery>;
type ApiReg021RequestBody = z.infer<typeof apiReg021.requestBody>;
type ApiReg021ResponseOk = z.infer<(typeof apiReg021.responseBodyMap)[200]>;

export default apiReg021;

export type {
  ApiReg021RequestParam,
  ApiReg021RequestQuery,
  ApiReg021RequestBody,
  ApiReg021ResponseOk,
};
