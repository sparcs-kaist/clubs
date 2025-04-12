import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

import registrationTypeEnumChecker from "../utils/registrationTypeEnumChecker";

/**
 * @version v0.1
 * @description 집행부원이 이번 학기 동아리 등록 신청서를 조회합니다.
 */

const url = (applyId: string) =>
  `/executive/registrations/club-registrations/club-registration/${applyId}`;
const method = "GET";

const requestParam = z.object({
  applyId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z
    .object({
      id: z.coerce.number().int().min(1),
      registrationTypeEnumId: z.nativeEnum(RegistrationTypeEnum),
      registrationStatusEnumId: z.nativeEnum(RegistrationStatusEnum),
      clubId: z.coerce.number().int().min(1).optional(),
      clubNameKr: zClubName,
      clubNameEn: zClubName,
      newClubNameKr: zClubName,
      newClubNameEn: zClubName,
      representative: z.object({
        studentNumber: z.coerce.number().int().min(1),
        name: z.string().max(30),
        phoneNumber: zKrPhoneNumber,
      }),
      foundedAt: z.coerce.date(),
      divisionId: z.coerce.number().int().min(1),
      activityFieldKr: z.string().max(255),
      activityFieldEn: z.string().max(255),
      professor: z
        .object({
          name: z.coerce.string().max(255),
          email: z
            .string()
            .email()
            .refine(email => email.endsWith("@kaist.ac.kr"), {
              message: "Must be a valid KAIST email address",
            }),
          professorEnumId: z.nativeEnum(ProfessorEnum),
        })
        .optional(),
      divisionConsistency: z.coerce.string(),
      foundationPurpose: z.coerce.string(),
      activityPlan: z.coerce.string(),
      activityPlanFile: z
        .object({
          id: z.string().max(128),
          name: z.string().max(255),
          url: z.string().max(255),
        })
        .optional(),
      clubRuleFile: z
        .object({
          id: z.string().max(128),
          name: z.string().max(255),
          url: z.string().max(255),
        })
        .optional(),
      externalInstructionFile: z
        .object({
          id: z.string().max(128),
          name: z.string().max(255),
          url: z.string().max(255),
        })
        .optional(),
      isProfessorSigned: z.coerce.boolean(),
      updatedAt: z.coerce.date(),
      comments: z.array(
        z.object({
          content: z.string(),
          createdAt: z.coerce.date(),
        }),
      ),
    })
    .refine(args => registrationTypeEnumChecker(args)),
};

const responseErrorMap = {};

const apiReg015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg015RequestParam = z.infer<typeof apiReg015.requestParam>;
type ApiReg015RequestQuery = z.infer<typeof apiReg015.requestQuery>;
type ApiReg015RequestBody = z.infer<typeof apiReg015.requestBody>;
type ApiReg015ResponseOk = z.infer<(typeof apiReg015.responseBodyMap)[200]>;

export default apiReg015;

export type {
  ApiReg015RequestParam,
  ApiReg015RequestQuery,
  ApiReg015RequestBody,
  ApiReg015ResponseOk,
};
