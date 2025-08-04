import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 학기의 활동보고서 제출 기한을 삭제합니다.
 */

const url = (deadlineId: number) =>
  `/executive/semesters/activity-deadlines/${deadlineId}`;
const method = "DELETE";

const requestParam = z.object({
  deadlineId: zActivityDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zActivityDeadline.shape.id,
  }),
};

const responseErrorMap = {};

export const apiSem010 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem010RequestParam = z.infer<typeof apiSem010.requestParam>;
type ApiSem010RequestQuery = z.infer<typeof apiSem010.requestQuery>;
type ApiSem010RequestBody = z.infer<typeof apiSem010.requestBody>;
type ApiSem010ResponseOK = z.infer<(typeof apiSem010.responseBodyMap)[200]>;

export type {
  ApiSem010RequestParam,
  ApiSem010RequestQuery,
  ApiSem010RequestBody,
  ApiSem010ResponseOK,
};

registry.registerPath({
  tags: ["semester"],
  method: "delete",
  path: "/executive/semesters/activity-deadlines/{deadlineId}",
  summary: "SEM-010: 활동보고서 제출 기한 삭제하기",
  description: "특정 학기의 활동보고서 제출 기한을 삭제합니다 (soft delete).",
  request: {
    params: apiSem010.requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 활동보고서 제출 기한을 삭제했습니다.",
      content: {
        "application/json": {
          schema: apiSem010.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    404: {
      description: "학기 또는 활동보고서 제출 기한을 찾을 수 없습니다.",
    },
  },
});
