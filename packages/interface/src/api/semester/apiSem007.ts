import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDeadline } from "@clubs/domain/semester/deadline";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 학기의 활동보고서 제출 기한 목록을 조회합니다.
 */

const url = () => `/executive/semesters/activity-deadlines`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  year: zSemester.shape.year,
  name: zSemester.shape.name,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    deadlines: z.array(
      z.object({
        id: zActivityDeadline.shape.id,
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
  summary: "SEM-007: 활동보고서 제출 기한 목록 조회하기",
  description: "특정 학기의 활동보고서 제출 기한 목록을 조회합니다.",
  request: {
    query: apiSem007.requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 활동보고서 제출 기한 목록을 조회했습니다.",
      content: {
        "application/json": {
          schema: apiSem007.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    404: {
      description: "학기를 찾을 수 없습니다.",
    },
  },
});
