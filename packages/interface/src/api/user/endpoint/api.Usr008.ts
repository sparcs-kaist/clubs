import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutive } from "@clubs/domain/user/executive";

/**
 * @version v0.1
 * @description 집행부원을 삭제합니다.
 */

const url = () => `/executive/user/executives/:executiveId`;
const method = "DELETE";

const requestParam = z.object({
  executiveId: zExecutive.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiUsr008 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr008RequestParam = z.infer<typeof apiUsr008.requestParam>;
type ApiUsr008RequestQuery = z.infer<typeof apiUsr008.requestQuery>;
type ApiUsr008RequestBody = z.infer<typeof apiUsr008.requestBody>;
type ApiUsr008ResponseOk = z.infer<(typeof apiUsr008.responseBodyMap)[200]>;

export default apiUsr008;

export type {
  ApiUsr008RequestParam,
  ApiUsr008RequestQuery,
  ApiUsr008RequestBody,
  ApiUsr008ResponseOk,
};
