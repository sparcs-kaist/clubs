import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

/**
 * @version v0.1
 * @description 학생용 신규등록 활동 리스트
 */

const url = () => `/student/provisional/activities`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({ clubId: z.coerce.number().int().min(1) });

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activities: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        name: z.string(),
        activityTypeEnumId: z.nativeEnum(ActivityTypeEnum),
        activityStatusEnumId: z.nativeEnum(ActivityStatusEnum),
        durations: z.array(
          z.object({
            startTerm: z.coerce.date(),
            endTerm: z.coerce.date(),
          }),
        ),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct011 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct011RequestParam = z.infer<typeof apiAct011.requestParam>;
type ApiAct011RequestQuery = z.infer<typeof apiAct011.requestQuery>;
type ApiAct011RequestBody = z.infer<typeof apiAct011.requestBody>;
type ApiAct011ResponseOk = z.infer<(typeof apiAct011.responseBodyMap)[200]>;

export default apiAct011;

export type {
  ApiAct011RequestParam,
  ApiAct011RequestQuery,
  ApiAct011RequestBody,
  ApiAct011ResponseOk,
};
