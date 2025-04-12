import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 유저의 현재 전화번호를 가져옵니다
 */

const url = () => `/user/my/phone`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  profile: z.string(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    phoneNumber: z.union([zKrPhoneNumber, z.null()]),
  }),
};

const responseErrorMap = {};

const apiUsr002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr002RequestParam = z.infer<typeof apiUsr002.requestParam>;
type ApiUsr002RequestQuery = z.infer<typeof apiUsr002.requestQuery>;
type ApiUsr002RequestBody = z.infer<typeof apiUsr002.requestBody>;
type ApiUsr002ResponseOk = z.infer<(typeof apiUsr002.responseBodyMap)[200]>;

export default apiUsr002;

export type {
  ApiUsr002RequestParam,
  ApiUsr002RequestQuery,
  ApiUsr002RequestBody,
  ApiUsr002ResponseOk,
};
