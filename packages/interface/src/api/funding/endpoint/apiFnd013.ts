import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFunding, zFundingCommentRequestCreate } from "../type/funding.type";

/**
 * @version v0.1
 * @description 집행부원으로서 지원금 신청에 comment를 남깁니다.
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

const requestBody = zFundingCommentRequestCreate.omit({
  funding: true,
  chargedExecutive: true,
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
