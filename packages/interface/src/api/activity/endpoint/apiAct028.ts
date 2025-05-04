import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutiveSummary } from "@clubs/interface/api/user/type/user.type";

import { zActivitySummaryResponse } from "../type/activity.type";

const url = (executiveId: number) =>
  `/executive/activities/executives/executive/${executiveId}/brief`;
export const ApiAct028RequestUrl =
  "/executive/activities/executives/executive/:executiveId/brief";
const method = "GET";

const requestParam = z.object({
  executiveId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    chargedExecutive: zExecutiveSummary,
    activities: zActivitySummaryResponse
      .extend({
        chargedExecutive: zExecutiveSummary.nullable(),
        commentedExecutive: zExecutiveSummary.nullable(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiAct028 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct028RequestParam = z.infer<typeof apiAct028.requestParam>;
type ApiAct028RequestQuery = z.infer<typeof apiAct028.requestQuery>;
type ApiAct028RequestBody = z.infer<typeof apiAct028.requestBody>;
type ApiAct028ResponseOk = z.infer<(typeof apiAct028.responseBodyMap)[200]>;

export default apiAct028;

export type {
  ApiAct028RequestParam,
  ApiAct028RequestQuery,
  ApiAct028RequestBody,
  ApiAct028ResponseOk,
};
