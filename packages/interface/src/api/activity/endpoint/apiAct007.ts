import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

/**
 * @version v0.1
 * @description 활동보고서의 활동을 생성합니다.(가동아리 동아리 신규등록 신청을 위한 예외적 활동보고서 작성 기능입니다.)
 */

const url = () => `/student/activities/activity/provisional`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: z.coerce.number().int().min(1),
  name: z.coerce.string().max(255),
  activityTypeEnumId: z.nativeEnum(ActivityTypeEnum),
  durations: z.array(
    z.object({
      startTerm: z.coerce.date(),
      endTerm: z.coerce.date(),
    }),
  ),
  location: z.coerce.string().max(255),
  purpose: z.coerce.string(),
  detail: z.coerce.string(),
  evidence: z.coerce.string(),
  evidenceFiles: z.array(
    z.object({
      fileId: z.coerce.string().max(255),
    }),
  ),
  participants: z.array(
    z.object({
      studentId: z.coerce.number().int().min(1),
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiAct007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct007RequestParam = z.infer<typeof apiAct007.requestParam>;
type ApiAct007RequestQuery = z.infer<typeof apiAct007.requestQuery>;
type ApiAct007RequestBody = z.infer<typeof apiAct007.requestBody>;
type ApiAct007ResponseCreated = z.infer<
  (typeof apiAct007.responseBodyMap)[201]
>;

export default apiAct007;

export type {
  ApiAct007RequestBody,
  ApiAct007RequestParam,
  ApiAct007RequestQuery,
  ApiAct007ResponseCreated,
};
