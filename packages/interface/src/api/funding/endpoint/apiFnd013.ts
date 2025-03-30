import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFundingComment } from "../type/funding.comment.type";
import { zFunding } from "../type/funding.type";

/**
 * @version v0.1
 * @description 집행부원으로서 지원금 신청에 comment를 남깁니다.
 * applied로는 바꿀 수 없습니다.
 * approved 의 경우 expenditureAmount와 approvedAmount가 동일해야 합니다.
 * rejected의 경우 approvedAmount는 0이어야 합니다.
 * partial의 경우 expenditureAmount보다 approvedAmount가 작아야 합니다.
 */

const url = (id: number) =>
  `/executive/fundings/funding/${id}/comments/comment`;
const method = "POST";
export const ApiFnd013RequestUrl =
  "/executive/fundings/funding/:id/comments/comment";

const requestParam = z.object({
  id: zFunding.pick({ id: true }).shape.id,
});

const requestQuery = z.object({});

const requestBody = zFundingComment.omit({
  id: true,
  createdAt: true,
  deletedAt: true,
  funding: true,
  executive: true,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiFnd013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd013RequestParam = z.infer<typeof apiFnd013.requestParam>;
type ApiFnd013RequestQuery = z.infer<typeof apiFnd013.requestQuery>;
type ApiFnd013RequestBody = z.infer<typeof apiFnd013.requestBody>;
type ApiFnd013ResponseCreated = z.infer<
  (typeof apiFnd013.responseBodyMap)[201]
>;

export default apiFnd013;

export type {
  ApiFnd013RequestParam,
  ApiFnd013RequestQuery,
  ApiFnd013RequestBody,
  ApiFnd013ResponseCreated,
};
