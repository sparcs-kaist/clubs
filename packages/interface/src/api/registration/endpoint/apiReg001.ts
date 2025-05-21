import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

import registrationTypeEnumChecker from "../utils/registrationTypeEnumChecker";

/**
 * @version v0.1
 * @description 새로운 동아리 등록을 신청합니다.
 * 신청의 종류는 다음과 같습니다.(가동아리 등록, 신규 동아리 등록, 재등록)
 * 신청의 종류에 따라 RequestBody의 검사 규칙이 다릅니다.
 */

const url = () => `/student/registrations/club-registrations/club-registration`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z
  .object({
    clubId: z.coerce.number().int().min(1).nullable().optional(),
    registrationTypeEnumId: z.nativeEnum(RegistrationTypeEnum),
    clubNameKr: zClubName,
    clubNameEn: zClubName,
    phoneNumber: zKrPhoneNumber, // 대표자 전화번호
    /**
     * 가동아리 신청의 경우 설립연월이 신청에 포함됩니다.
     * 신규등록 | 재등록의 경우 설립연도가 신청에 포함됩니다.
     */
    foundedAt: z.coerce.date(),
    divisionId: z.coerce.number().int().min(1),
    activityFieldKr: z.string().max(255),
    activityFieldEn: z.string().max(255),
    /**
     * 지도교수란이 기입되어 있으면 지도교수를 포함한 신청이고,
     * 없다면 지도교수 없는 동아리 신청으로 처리됩니다.
     */
    professor: z
      .object({
        name: z.string(),
        email: z
          .string()
          .email()
          .refine(email => email.endsWith("@kaist.ac.kr"), {
            message: "Must be a valid KAIST email address",
          }),
        professorEnumId: z.nativeEnum(ProfessorEnum),
      })
      .nullable()
      .optional(),
    divisionConsistency: z.coerce.string(),
    foundationPurpose: z.coerce.string(),
    activityPlan: z.coerce.string(),
    activityPlanFileId: z.coerce.string().max(128).optional(),
    /**
     * 동아리 회칙 파일은 가등록 | 재등록인 경우 undefined,
     * 신규등록의 경우 업로드한 파일 id가 존재해야 합니다.,
     */
    clubRuleFileId: z.coerce.string().max(128).optional(),
    /**
     * 외부강사 초빙 계획 회칙 파일은 항상 optional 합니다.
     */
    externalInstructionFileId: z.coerce.string().max(128).optional(),
  })
  .refine(args => registrationTypeEnumChecker(args));

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({
    id: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiReg001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg001RequestParam = z.infer<typeof apiReg001.requestParam>;
type ApiReg001RequestQuery = z.infer<typeof apiReg001.requestQuery>;
type ApiReg001RequestBody = z.infer<typeof apiReg001.requestBody>;
type ApiReg001ResponseCreated = z.infer<
  (typeof apiReg001.responseBodyMap)[201]
>;

export default apiReg001;

export type {
  ApiReg001RequestParam,
  ApiReg001RequestQuery,
  ApiReg001RequestBody,
  ApiReg001ResponseCreated,
};
