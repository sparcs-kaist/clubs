import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 활동보고서의 활동을 삭제합니다.
 * 동아리 대표자로 로그인되어 있어야 합니다.
 */

const url = (activityId: number) =>
  `/student/activities/activity/${activityId}`;
const method = "DELETE";

const requestParam = z.object({
  activityId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct004 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct004RequestParam = z.infer<typeof apiAct004.requestParam>;
type ApiAct004RequestQuery = z.infer<typeof apiAct004.requestQuery>;
type ApiAct004RequestBody = z.infer<typeof apiAct004.requestBody>;
type ApiAct004ResponseOk = z.infer<(typeof apiAct004.responseBodyMap)[200]>;

export default apiAct004;

export type {
  ApiAct004RequestParam,
  ApiAct004RequestQuery,
  ApiAct004RequestBody,
  ApiAct004ResponseOk,
};
