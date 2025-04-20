import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

/**
 * @version v0.1
 * @description 현재 학기의 활동보고서를 조회합니다.
 */

const url = () => `/professor/activities`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z
    .object({
      id: z.coerce.number().int().min(1),
      activityStatusEnumId: z.nativeEnum(ActivityStatusEnum),
      name: z.string().max(255),
      activityTypeEnumId: z.nativeEnum(ActivityTypeEnum),
      durations: z.array(
        z.object({
          startTerm: z.coerce.date(),
          endTerm: z.coerce.date(),
        }),
      ),
      professorApprovedAt: z.coerce.date().nullable(),
      editedAt: z.coerce.date(),
      commentedAt: z.coerce.date().nullable(),
    })
    .array(),
};

const responseErrorMap = {};

const apiAct019 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct019RequestParam = z.infer<typeof apiAct019.requestParam>;
type ApiAct019RequestQuery = z.infer<typeof apiAct019.requestQuery>;
type ApiAct019RequestBody = z.infer<typeof apiAct019.requestBody>;
type ApiAct019ResponseOk = z.infer<(typeof apiAct019.responseBodyMap)[200]>;

export default apiAct019;

export type {
  ApiAct019RequestBody,
  ApiAct019RequestParam,
  ApiAct019RequestQuery,
  ApiAct019ResponseOk,
};
