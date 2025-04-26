import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";

import { zActivity } from "../type/activity.type";

/**
 * @version v0.1
 * @description 동아리의 특정 활동반기의 활동보고서를 조회합니다.
 * - 동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.
 */

const url = (activityTermId: number) =>
  `/student/activities/activity-terms/activity-term/${activityTermId}`;
const method = "GET";

const requestParam = z.object({
  activityTermId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({
  clubId: zClub.shape.id,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activities: z.array(
      z.object({
        id: zActivity.shape.id,
        name: zActivity.shape.name,
        activityTypeEnumId: zActivity.shape.activityTypeEnum,
        durations: zActivity.shape.durations,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct006RequestParam = z.infer<typeof apiAct006.requestParam>;
type ApiAct006RequestQuery = z.infer<typeof apiAct006.requestQuery>;
type ApiAct006RequestBody = z.infer<typeof apiAct006.requestBody>;
type ApiAct006ResponseOk = z.infer<(typeof apiAct006.responseBodyMap)[200]>;

export default apiAct006;

export type {
  ApiAct006RequestBody,
  ApiAct006RequestParam,
  ApiAct006RequestQuery,
  ApiAct006ResponseOk,
};
