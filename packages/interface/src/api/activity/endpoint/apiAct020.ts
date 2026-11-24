import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 지도교수가 동아리의 활동보고서를 승인합니다.
 */

const url = () => `/professor/activities/approve`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  activities: z
    .object({ id: z.coerce.number().int().min(1) })
    .array()
    .min(1),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiAct020 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct020RequestParam = z.infer<typeof apiAct020.requestParam>;
type ApiAct020RequestQuery = z.infer<typeof apiAct020.requestQuery>;
type ApiAct020RequestBody = z.infer<typeof apiAct020.requestBody>;
type ApiAct020ResponseCreated = z.infer<
  (typeof apiAct020.responseBodyMap)[201]
>;

export default apiAct020;

export type {
  ApiAct020RequestBody,
  ApiAct020RequestParam,
  ApiAct020RequestQuery,
  ApiAct020ResponseCreated,
};
