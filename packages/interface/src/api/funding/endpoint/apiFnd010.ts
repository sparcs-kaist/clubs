import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutiveSummary } from "@clubs/interface/api/user/type/user.type";

import { zFundingSummaryResponse } from "../type/funding.type";

/**
 * @version v0.1
 * @description 집행부원을 위한 해당 집행부원이 맡은 지원금 신청 내역을 조회합니다.
 */

// TODO: 변경 필요

const url = (executiveId: number) =>
  `/executive/fundings/executives/executive/${executiveId}/brief`;
const method = "GET";
export const ApiFnd010RequestUrl =
  "/executive/fundings/executives/executive/:executiveId/brief";

const requestParam = z.object({
  executiveId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    chargedExecutive: zExecutiveSummary,
    totalCount: z.coerce.number().min(0),
    appliedCount: z.coerce.number().min(0),
    approvedCount: z.coerce.number().min(0),
    partialCount: z.coerce.number().min(0),
    rejectedCount: z.coerce.number().min(0),
    committeeCount: z.coerce.number().min(0),
    fundings: zFundingSummaryResponse
      .extend({
        chargedExecutive: zExecutiveSummary.nullable(),
        commentedExecutive: zExecutiveSummary.nullable(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiFnd010 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd010RequestParam = z.infer<typeof apiFnd010.requestParam>;
type ApiFnd010RequestQuery = z.infer<typeof apiFnd010.requestQuery>;
type ApiFnd010RequestBody = z.infer<typeof apiFnd010.requestBody>;
type ApiFnd010ResponseOk = z.infer<(typeof apiFnd010.responseBodyMap)[200]>;

export default apiFnd010;

export type {
  ApiFnd010RequestParam,
  ApiFnd010RequestQuery,
  ApiFnd010RequestBody,
  ApiFnd010ResponseOk,
};
