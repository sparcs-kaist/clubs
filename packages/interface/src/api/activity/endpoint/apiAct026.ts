import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 동아리의 활동보고서에 대한 담당 집행부원을 변경합니다.
 */

const url = () => `/executive/activities/club-charged-executive`;
const method = "PUT";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubIds: zId.array(),
  executiveId: zId,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct026 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct026RequestParam = z.infer<typeof apiAct026.requestParam>;
type ApiAct026RequestQuery = z.infer<typeof apiAct026.requestQuery>;
type ApiAct026RequestBody = z.infer<typeof apiAct026.requestBody>;
type ApiAct026ResponseOk = z.infer<(typeof apiAct026.responseBodyMap)[200]>;

export default apiAct026;

export type {
  ApiAct026RequestParam,
  ApiAct026RequestQuery,
  ApiAct026RequestBody,
  ApiAct026ResponseOk,
};
