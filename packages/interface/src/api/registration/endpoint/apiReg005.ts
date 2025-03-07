import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";

/**
 * @version v0.1
 * @description 동아리 가입을 신청합니다.
 */

const url = () =>
  `/student/registrations/member-registrations/member-registration`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: zClub.shape.id,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiReg005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg005RequestParam = z.infer<typeof apiReg005.requestParam>;
type ApiReg005RequestQuery = z.infer<typeof apiReg005.requestQuery>;
type ApiReg005RequestBody = z.infer<typeof apiReg005.requestBody>;
type ApiReg005ResponseCreated = z.infer<
  (typeof apiReg005.responseBodyMap)[201]
>;

export default apiReg005;

export type {
  ApiReg005RequestParam,
  ApiReg005RequestQuery,
  ApiReg005RequestBody,
  ApiReg005ResponseCreated,
};
