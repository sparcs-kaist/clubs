import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

/**
 * @version v0.1
 * @description 동아리 가입 신청의 상태를 변경합니다.
 */

const url = (applyId: string) =>
  `/student/registrations/member-registrations/member-registration/${applyId}`;
const method = "PATCH";

const requestParam = z.object({
  applyId: zMemberRegistration.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: zClub.shape.id,
  applyStatusEnumId: z.nativeEnum(RegistrationApplicationStudentStatusEnum),
});

const responseBodyMap = {
  [HttpStatusCode.NoContent]: z.object({}),
};

const responseErrorMap = {};

const apiReg007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg007RequestParam = z.infer<typeof apiReg007.requestParam>;
type ApiReg007RequestQuery = z.infer<typeof apiReg007.requestQuery>;
type ApiReg007RequestBody = z.infer<typeof apiReg007.requestBody>;
type ApiReg007ResponseNoContent = z.infer<
  (typeof apiReg007.responseBodyMap)[204]
>;

export default apiReg007;

export type {
  ApiReg007RequestParam,
  ApiReg007RequestQuery,
  ApiReg007RequestBody,
  ApiReg007ResponseNoContent,
};
