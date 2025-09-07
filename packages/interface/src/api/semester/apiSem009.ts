import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDeadline } from "@clubs/domain/semester/deadline";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 학기의 특정 활동보고서 제출 기한을 수정합니다. (구현 예정)
 */

const url = (deadlineId: number) =>
  `/executive/semesters/activity-deadlines/${deadlineId}`;
const method = "PUT";

const requestParam = z.object({
  semesterId: zSemester.shape.id,
  deadlineId: zActivityDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  deadlineEnum: zActivityDeadline.shape.deadlineEnum.optional(),
  startTerm: zActivityDeadline.shape.startTerm.optional(),
  endTerm: zActivityDeadline.shape.endTerm.optional(),
});

const responseBodyMap = {
  [HttpStatusCode.NotImplemented]: z.object({}),
};

const responseErrorMap = {};

export const apiSem009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem009RequestParam = z.infer<typeof apiSem009.requestParam>;
type ApiSem009RequestQuery = z.infer<typeof apiSem009.requestQuery>;
type ApiSem009RequestBody = z.infer<typeof apiSem009.requestBody>;
type ApiSem009ResponseNotImplemented = z.infer<
  (typeof apiSem009.responseBodyMap)[501]
>;

export type {
  ApiSem009RequestParam,
  ApiSem009RequestQuery,
  ApiSem009RequestBody,
  ApiSem009ResponseNotImplemented,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters/activity-deadlines/{deadlineId}",
  summary: "SEM-009: 특정 활동보고서 제출 기한 수정하기 (미구현)",
  description: "특정 학기의 특정 활동보고서 제출 기한을 수정합니다.",
  request: {
    params: apiSem009.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiSem009.requestBody,
        },
      },
    },
  },
  responses: {
    501: {
      description: "아직 구현되지 않은 기능입니다.",
    },
  },
});
