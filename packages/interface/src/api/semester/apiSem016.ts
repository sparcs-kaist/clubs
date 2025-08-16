import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zFundingDeadline } from "@clubs/domain/semester/deadline";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 지원금 신청 기간 목록을 조회합니다.
 */

const url = `/executive/semesters/funding-deadlines`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  activityDId: zActivityDuration.shape.id.optional(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    deadlines: z.array(
      z.object({
        id: zFundingDeadline.shape.id,
        semesterId: zSemester.shape.id,
        activityDId: zActivityDuration.shape.id,
        deadlineEnum: zFundingDeadline.shape.deadlineEnum,
        startTerm: zFundingDeadline.shape.startTerm,
        endTerm: zFundingDeadline.shape.endTerm,
      }),
    ),
  }),
};

const responseErrorMap = {};

export const apiSem016 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem016RequestParam = z.infer<typeof apiSem016.requestParam>;
type ApiSem016RequestQuery = z.infer<typeof apiSem016.requestQuery>;
type ApiSem016RequestBody = z.infer<typeof apiSem016.requestBody>;
type ApiSem016ResponseOk = z.infer<(typeof apiSem016.responseBodyMap)[200]>;

export type {
  ApiSem016RequestParam,
  ApiSem016RequestQuery,
  ApiSem016RequestBody,
  ApiSem016ResponseOk,
};

registry.registerPath({
  tags: ["semester"],
  method: "get",
  path: "/executive/semesters/funding-deadlines",
  summary: "SEM-016: 지원금 신청 기간 목록 조회하기",
  description: `
  지원금 신청 기간을 목록을 조회합니다.
  1. 활동 기간 ID로 특정 지원금 신청 기간을 조회할 수 있습니다.
  2. 페이지네이션 없이 전체를 반환합니다.
  3. 각 항목은 연관된 학기(semesterId)와 활동 기간(activityDId) 정보를 포함합니다.
  `,
  request: {
    query: apiSem016.requestQuery,
  },
  responses: {
    200: {
      description: "지원금 신청 기간이 조회되었습니다.",
      content: {
        "application/json": {
          schema: apiSem016.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    404: {
      description: "해당 활동 기간을 찾을 수 없습니다.",
    },
  },
});
