import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리가 활동한 활동 기간 리스트를 조회합니다.
 * - 동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.
 */

const url = () => `/student/activities/activity-terms`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zClub.shape.id,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    terms: z.array(
      z.object({
        id: zActivityDuration.shape.id,
        year: zActivityDuration.shape.year,
        name: zActivityDuration.shape.name,
        startTerm: zActivityDuration.shape.startTerm,
        endTerm: zActivityDuration.shape.endTerm,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct009RequestParam = z.infer<typeof apiAct009.requestParam>;
type ApiAct009RequestQuery = z.infer<typeof apiAct009.requestQuery>;
type ApiAct009RequestBody = z.infer<typeof apiAct009.requestBody>;
type ApiAct009ResponseOk = z.infer<(typeof apiAct009.responseBodyMap)[200]>;

export default apiAct009;

export type {
  ApiAct009RequestBody,
  ApiAct009RequestParam,
  ApiAct009RequestQuery,
  ApiAct009ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  summary: `ACT-009: 가동아리 활동보고서 작성을 위해 동아리가 활동한 활동 기간 리스트를 조회합니다.`,
  description: `
  # ACT-009

  가동아리 활동보고서 작성을 위해 동아리가 활동한 활동 기간 리스트를 조회합니다.

  동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.
  `,
  request: {
    query: requestQuery,
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        "성공적으로 동아리가 활동한 활동 기간 리스트를 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
