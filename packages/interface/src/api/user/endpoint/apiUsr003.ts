import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 유저의 전화번호를 변경합니다.
 */

const url = () => `/user/my/phone`;
const method = "PATCH";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  profile: z.string(),
  phoneNumber: zKrPhoneNumber,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiUsr003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr003RequestParam = z.infer<typeof apiUsr003.requestParam>;
type ApiUsr003RequestQuery = z.infer<typeof apiUsr003.requestQuery>;
type ApiUsr003RequestBody = z.infer<typeof apiUsr003.requestBody>;
type ApiUsr003ResponseOK = z.infer<(typeof apiUsr003.responseBodyMap)[200]>;

export default apiUsr003;

export type {
  ApiUsr003RequestParam,
  ApiUsr003RequestQuery,
  ApiUsr003RequestBody,
  ApiUsr003ResponseOK,
};
