import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFundingCommentResponse } from "../type/funding.comment.type";
import { zFundingResponse } from "../type/funding.type";

/**
 * @version v0.1
 * @description 지원금 신청의 항목을 조회합니다.
 */

const url = (id: number) => `/student/fundings/funding/${id}`;
const method = "GET";

const requestParam = z.object({
  id: z.coerce.number().int().min(1),
});

const requestQuery = z.object({
  operatingCommitteeSecret: z.string().max(255).optional(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    funding: zFundingResponse,
    comments: z.array(zFundingCommentResponse),
  }),
};

const responseErrorMap = {};

const apiFnd002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd002RequestParam = z.infer<typeof apiFnd002.requestParam>;
type ApiFnd002RequestQuery = z.infer<typeof apiFnd002.requestQuery>;
type ApiFnd002RequestBody = z.infer<typeof apiFnd002.requestBody>;
type ApiFnd002ResponseOk = z.infer<(typeof apiFnd002.responseBodyMap)[200]>;

export default apiFnd002;

export type {
  ApiFnd002RequestParam,
  ApiFnd002RequestQuery,
  ApiFnd002RequestBody,
  ApiFnd002ResponseOk,
};
