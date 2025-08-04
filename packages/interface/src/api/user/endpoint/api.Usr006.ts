import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

import { zExecutive } from "../type/user.type";

/**
 * @version v0.1
 * @description 새로운 집행부원을 추가합니다.
 */

const url = () => `/executive/user/executives`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  studentNumber: zExecutive.shape.studentNumber,
  name: zExecutive.shape.name,
  email: z
    .string()
    .email()
    .refine(email => email.endsWith("@kaist.ac.kr"), {
      message: "Must be a valid KAIST email address",
    })
    .optional()
    .nullable(),
  phoneNumber: zKrPhoneNumber.optional().nullable(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiUsr006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr006RequestParam = z.infer<typeof apiUsr006.requestParam>;
type ApiUsr006RequestQuery = z.infer<typeof apiUsr006.requestQuery>;
type ApiUsr006RequestBody = z.infer<typeof apiUsr006.requestBody>;
type ApiUsr006ResponseCreated = z.infer<
  (typeof apiUsr006.responseBodyMap)[201]
>;

export default apiUsr006;

export type {
  ApiUsr006RequestParam,
  ApiUsr006RequestQuery,
  ApiUsr006RequestBody,
  ApiUsr006ResponseCreated,
};
