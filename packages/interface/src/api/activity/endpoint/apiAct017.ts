import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zDbText } from "@clubs/domain/common/string";

/**
 * @version v0.1
 * @description 집행부원으로서 동아리 등록 신청을 수락(ActivityStatusEnum.Rejected)합니다.
 */

const url = (activityId: number) =>
  `/executive/activities/activity/${activityId}/send-back`;
const method = "PATCH";

const requestParam = z.object({
  activityId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  comment: zDbText,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct017 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct017RequestParam = z.infer<typeof apiAct017.requestParam>;
type ApiAct017RequestQuery = z.infer<typeof apiAct017.requestQuery>;
type ApiAct017RequestBody = z.infer<typeof apiAct017.requestBody>;
type ApiAct017ResponseOk = z.infer<(typeof apiAct017.responseBodyMap)[200]>;

export default apiAct017;

export type {
  ApiAct017RequestParam,
  ApiAct017RequestQuery,
  ApiAct017RequestBody,
  ApiAct017ResponseOk,
};
