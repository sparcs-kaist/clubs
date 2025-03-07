import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zUserName } from "@sparcs-clubs/interface/common/commonString";
import { zKrPhoneNumber } from "@sparcs-clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 동아리별 가입 신청의 세부 상태를 확인합니다.
 */

const url = () => `/executive/registrations/member-registrations`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zClub.shape.id,
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    totalRegistrations: z.coerce.number().int().min(0),
    totalWaitings: z.coerce.number().int().min(0),
    totalApprovals: z.coerce.number().int().min(0),
    totalRejections: z.coerce.number().int().min(0),
    regularMemberRegistrations: z.coerce.number().int().min(0),
    regularMemberWaitings: z.coerce.number().int().min(0),
    regularMemberApprovals: z.coerce.number().int().min(0),
    regularMemberRejections: z.coerce.number().int().min(0),
    items: z.array(
      z.object({
        memberRegistrationId: z.coerce.number().int().min(1),
        RegistrationApplicationStudentStatusEnumId: z.coerce
          .number()
          .int()
          .min(1),
        isRegularMemberRegistration: z.coerce.boolean(),
        student: z.object({
          id: z.coerce.number().int().min(1),
          studentNumber: z.coerce.number().int().min(1),
          name: zUserName,
          phoneNumber: zKrPhoneNumber.optional(),
          email: z.string().email(),
        }),
      }),
    ),
    total: z.coerce.number().min(1),
    offset: z.coerce.number().min(1),
  }),
};

const responseErrorMap = {};

const apiReg020 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg020RequestParam = z.infer<typeof apiReg020.requestParam>;
type ApiReg020RequestQuery = z.infer<typeof apiReg020.requestQuery>;
type ApiReg020RequestBody = z.infer<typeof apiReg020.requestBody>;
type ApiReg020ResponseOk = z.infer<(typeof apiReg020.responseBodyMap)[200]>;

export default apiReg020;

export type {
  ApiReg020RequestParam,
  ApiReg020RequestQuery,
  ApiReg020RequestBody,
  ApiReg020ResponseOk,
};
