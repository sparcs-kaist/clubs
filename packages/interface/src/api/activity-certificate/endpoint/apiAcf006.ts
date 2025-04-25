import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 신청한 활동확인서 발급을 승인합니다
 */

const url = (id: number) =>
  `/student/activity-certificates/activity-certificate/${id}`;
const method = "PUT";

const requestParam = z.object({
  id: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAcf006 = {
  url,
  method,
  requestParam,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAcf006RequestParam = z.infer<typeof apiAcf006.requestParam>;
type ApiAcf006RequestBody = z.infer<typeof apiAcf006.requestBody>;
type ApiAcf006ResponseOk = z.infer<(typeof apiAcf006.responseBodyMap)[200]>;

export default apiAcf006;

export type {
  ApiAcf006RequestParam,
  ApiAcf006RequestBody,
  ApiAcf006ResponseOk,
};
