import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 신청한 활동확인서 발급 신청 정보를 삭제합니다
 */

const url = (id: number) =>
  `/student/activity-certificates/activity-certificate/${id}`;
const method = "DELETE";

const requestParam = z.object({
  id: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAcf005 = {
  url,
  method,
  requestParam,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAcf005RequestParam = z.infer<typeof apiAcf005.requestParam>;
type ApiAcf005RequestBody = z.infer<typeof apiAcf005.requestBody>;
type ApiAcf005ResponseOk = z.infer<(typeof apiAcf005.responseBodyMap)[200]>;

export default apiAcf005;

export type {
  ApiAcf005RequestParam,
  ApiAcf005RequestBody,
  ApiAcf005ResponseOk,
};
