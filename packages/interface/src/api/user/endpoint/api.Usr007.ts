import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutive } from "@clubs/interface/api/user/type/user.type";

/**
 * @version v0.1
 * @description 집행부원을 조회합니다.
 */

const url = () => `/executive/user/executives`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    executives: z.array(
      z.object({
        id: zExecutive.shape.id,
        userId: zExecutive.shape.userId,
        studentNumber: zExecutive.shape.studentNumber,
        name: zExecutive.shape.name,
        email: zExecutive.shape.email,
        phoneNumber: zExecutive.shape.phoneNumber,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiUsr007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr007RequestParam = z.infer<typeof apiUsr007.requestParam>;
type ApiUsr007RequestQuery = z.infer<typeof apiUsr007.requestQuery>;
type ApiUsr007RequestBody = z.infer<typeof apiUsr007.requestBody>;
type ApiUsr007ResponseOk = z.infer<(typeof apiUsr007.responseBodyMap)[200]>;

export default apiUsr007;

export type {
  ApiUsr007RequestParam,
  ApiUsr007RequestQuery,
  ApiUsr007RequestBody,
  ApiUsr007ResponseOk,
};
