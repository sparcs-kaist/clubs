import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { zClubSummary } from "@clubs/interface/api/club/type/club.type";
import { zExecutiveSummary } from "@clubs/interface/api/user/type/user.type";

import { zFundingSummaryResponse } from "../type/funding.type";

/**
 * @version v0.1
 * @description 집행부원을 위한 동아리의 지원금 신청 내역을 조회합니다.
 */

const url = (clubId: number) =>
  `/executive/fundings/clubs/club/${clubId}/brief`;
const method = "GET";
export const ApiFnd009RequestUrl =
  "/executive/fundings/clubs/club/:clubId/brief";

const requestParam = z.object({
  clubId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({
  activityDurationId: zActivityDuration.shape.id.optional(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    club: zClubSummary,
    totalCount: z.coerce.number().min(0),
    appliedCount: z.coerce.number().min(0),
    approvedCount: z.coerce.number().min(0),
    partialCount: z.coerce.number().min(0),
    rejectedCount: z.coerce.number().min(0),
    committeeCount: z.coerce.number().min(0),
    chargedExecutive: zExecutiveSummary.nullable(),
    fundings: zFundingSummaryResponse
      .extend({
        chargedExecutive: zExecutiveSummary.nullable(),
        commentedExecutive: zExecutiveSummary.nullable(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiFnd009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd009RequestParam = z.infer<typeof apiFnd009.requestParam>;
type ApiFnd009RequestQuery = z.infer<typeof apiFnd009.requestQuery>;
type ApiFnd009RequestBody = z.infer<typeof apiFnd009.requestBody>;
type ApiFnd009ResponseOk = z.infer<(typeof apiFnd009.responseBodyMap)[200]>;

export default apiFnd009;

export type {
  ApiFnd009RequestBody,
  ApiFnd009RequestParam,
  ApiFnd009RequestQuery,
  ApiFnd009ResponseOk,
};
