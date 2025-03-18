import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zMemberRegistration } from "@sparcs-clubs/interface/api/registration/type/member.registration.type";

/**
 * @version v0.1
 * @description 동아리 가입 신청을 취소합니다.
 */

const url = (applyId: string) =>
  `/student/registrations/member-registrations/member-registration/${applyId}`;
const method = "DELETE";

const requestParam = z.object({
  applyId: zMemberRegistration.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiReg013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg013RequestParam = z.infer<typeof apiReg013.requestParam>;
type ApiReg013RequestQuery = z.infer<typeof apiReg013.requestQuery>;
type ApiReg013RequestBody = z.infer<typeof apiReg013.requestBody>;
type ApiReg013ResponseOk = z.infer<(typeof apiReg013.responseBodyMap)[200]>;

export default apiReg013;

export type {
  ApiReg013RequestParam,
  ApiReg013RequestQuery,
  ApiReg013RequestBody,
  ApiReg013ResponseOk,
};
