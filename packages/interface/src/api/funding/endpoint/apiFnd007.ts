import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zFundingDeadline } from "@clubs/domain/semester/deadline";

/**
 * @version v0.1
 * @description 지원금 신청의 작성 기한을 확인합니다.
 */

const url = () => `/public/fundings/deadline`;
const method = "GET";

const requestParam = z.object({});
const requestQuery = z.object({});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    targetDuration: zActivityDuration,
    deadline: zFundingDeadline.optional(),
  }),
};

const responseErrorMap = {};

const apiFnd007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd007RequestParam = z.infer<typeof apiFnd007.requestParam>;
type ApiFnd007RequestQuery = z.infer<typeof apiFnd007.requestQuery>;
type ApiFnd007RequestBody = z.infer<typeof apiFnd007.requestBody>;
type ApiFnd007ResponseOk = z.infer<(typeof apiFnd007.responseBodyMap)[200]>;

export default apiFnd007;

export type {
  ApiFnd007RequestParam,
  ApiFnd007RequestQuery,
  ApiFnd007RequestBody,
  ApiFnd007ResponseOk,
};
