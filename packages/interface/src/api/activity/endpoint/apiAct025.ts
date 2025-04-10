import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 개별 활동보고서에 대한 담당 집행부원을 변경합니다.
 */

const url = () => `/executive/activities`;
const method = "PATCH";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  activityIds: zId.array(),
  executiveId: zId,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct025 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct025RequestParam = z.infer<typeof apiAct025.requestParam>;
type ApiAct025RequestQuery = z.infer<typeof apiAct025.requestQuery>;
type ApiAct025RequestBody = z.infer<typeof apiAct025.requestBody>;
type ApiAct025ResponseOk = z.infer<(typeof apiAct025.responseBodyMap)[200]>;

export default apiAct025;

export type {
  ApiAct025RequestParam,
  ApiAct025RequestQuery,
  ApiAct025RequestBody,
  ApiAct025ResponseOk,
};
