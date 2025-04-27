import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 집행부원으로서 활동보고서 신청을 수락(activityStatusEnumId.Approved)합니다.
 */

const url = (activityId: number) =>
  `/executive/activities/activity/${activityId}/approval`;
const method = "PATCH";

const requestParam = z.object({
  activityId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct016 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct016RequestParam = z.infer<typeof apiAct016.requestParam>;
type ApiAct016RequestQuery = z.infer<typeof apiAct016.requestQuery>;
type ApiAct016RequestBody = z.infer<typeof apiAct016.requestBody>;
type ApiAct016ResponseOk = z.infer<(typeof apiAct016.responseBodyMap)[200]>;

export default apiAct016;

export type {
  ApiAct016RequestParam,
  ApiAct016RequestQuery,
  ApiAct016RequestBody,
  ApiAct016ResponseOk,
};
