import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zUserName } from "@clubs/interface/common/commonString";

/**
 * @version v0.1
 * @description
 */

const url = () => `/student/activities/available-members`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: z.coerce.number().int().min(1),
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    students: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        studentNumber: z.coerce.number().int().min(1),
        name: zUserName,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct010 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct010RequestParam = z.infer<typeof apiAct010.requestParam>;
type ApiAct010RequestQuery = z.infer<typeof apiAct010.requestQuery>;
type ApiAct010RequestBody = z.infer<typeof apiAct010.requestBody>;
type ApiAct010ResponseOk = z.infer<(typeof apiAct010.responseBodyMap)[200]>;

export default apiAct010;

export type {
  ApiAct010RequestParam,
  ApiAct010RequestQuery,
  ApiAct010RequestBody,
  ApiAct010ResponseOk,
};
