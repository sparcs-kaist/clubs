import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 활동반기 목록을 가져옵니다.
 */

const url = () => `/executive/semesters/activity-durations`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  semesterId: zSemester.shape.id.optional(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activityDurations: z.array(
      z.object({
        id: zActivityDuration.shape.id,
        semester: z.object({
          id: zSemester.shape.id,
          name: zSemester.shape.name,
          year: zSemester.shape.year,
        }),
        activityDurationTypeEnum:
          zActivityDuration.shape.activityDurationTypeEnum,
        year: zActivityDuration.shape.year,
        name: zActivityDuration.shape.name,
        startTerm: zActivityDuration.shape.startTerm,
        endTerm: zActivityDuration.shape.endTerm,
      }),
    ),
  }),
};

const responseErrorMap = {};

export const apiSem012 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem012RequestParam = z.infer<typeof apiSem012.requestParam>;
type ApiSem012RequestQuery = z.infer<typeof apiSem012.requestQuery>;
type ApiSem012RequestBody = z.infer<typeof apiSem012.requestBody>;
type ApiSem012ResponseOK = z.infer<(typeof apiSem012.responseBodyMap)[200]>;

export type {
  ApiSem012RequestParam,
  ApiSem012RequestQuery,
  ApiSem012RequestBody,
  ApiSem012ResponseOK,
};

registry.registerPath({
  tags: ["semester"],
  method: "get",
  path: "/executive/semesters/activity-durations",
  summary: "SEM-012: 활동반기 목록 조회",
  description: `
  활동반기 목록을 가져옵니다.
  - 학기ID, 활동반기 분류, 년도로 필터링할 수 있습니다.
  - 최신 활동반기부터 순서대로 정렬되어 있습니다.
  `,
  request: {
    query: apiSem012.requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 활동반기 목록을 조회했습니다.",
      content: {
        "application/json": {
          schema: apiSem012.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
