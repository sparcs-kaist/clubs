import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zStudentSummary } from "@clubs/interface/api/user/type/user.type";

/**
 * @version v0.1
 * @description 선택된 학기 활동보고서의 참여 인원을 불러옵니다.
 */

const url = (id: number) => `/student/activities/activity/${id}/participants`;
const method = "GET";
export const ApiAct022RequestUrl =
  "/student/activities/activity/:id/participants";

const requestParam = z.object({
  id: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    participants: z.array(zStudentSummary),
  }),
};

const responseErrorMap = {};

const apiAct022 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct022RequestParam = z.infer<typeof apiAct022.requestParam>;
type ApiAct022RequestQuery = z.infer<typeof apiAct022.requestQuery>;
type ApiAct022RequestBody = z.infer<typeof apiAct022.requestBody>;
type ApiAct022ResponseOk = z.infer<(typeof apiAct022.responseBodyMap)[200]>;

export default apiAct022;

export type {
  ApiAct022RequestBody,
  ApiAct022RequestParam,
  ApiAct022RequestQuery,
  ApiAct022ResponseOk,
};
