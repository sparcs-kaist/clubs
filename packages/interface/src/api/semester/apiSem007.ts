import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zActivityDeadline } from "@clubs/domain/semester/deadline";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 모든 활동기간의 활동보고서 제출 기한 목록을 조회합니다.
 */

const url = () => `/executive/semesters/activity-deadlines`;
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
        id: zActivityDeadline.shape.id,
        semesterId: zSemester.shape.id,
        activityDId: zActivityDuration.shape.id,
        deadlineEnum: zActivityDeadline.shape.deadlineEnum,
        startTerm: zActivityDeadline.shape.startTerm,
        endTerm: zActivityDeadline.shape.endTerm,
      }),
    ),
  }),
};

const responseErrorMap = {};

export const apiSem007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem007RequestParam = z.infer<typeof apiSem007.requestParam>;
type ApiSem007RequestQuery = z.infer<typeof apiSem007.requestQuery>;
type ApiSem007RequestBody = z.infer<typeof apiSem007.requestBody>;
type ApiSem007ResponseOK = z.infer<(typeof apiSem007.responseBodyMap)[200]>;

export type {
  ApiSem007RequestParam,
  ApiSem007RequestQuery,
  ApiSem007RequestBody,
  ApiSem007ResponseOK,
};

registry.registerPath({
  tags: ["semester"],
  method: "get",
  path: "/executive/semesters/activity-deadlines",
  summary: "SEM-007: 활동보고서 제출 기한 목록 조회",
  description: `
  모든 활동기간의 활동보고서 제출 기한 목록을 조회합니다.
  - 페이지네이션 없이 전체를 반환합니다.
  - 각 항목은 연관된 학기(semesterId)와 활동기간(activityDId) 정보를 포함합니다.
  `,
  request: {
    query: apiSem007.requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 활동보고서 제출 기한 목록을 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
  },
});
