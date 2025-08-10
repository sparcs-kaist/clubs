import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDeadline } from "@clubs/domain/semester/deadline";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 특정 학기의 특정 활동보고서 제출 기한을 가져옵니다. (구현 예정)
 */

const url = (deadlineId: number) =>
  `/executive/semesters/activity-deadlines/${deadlineId}`;

const method = "GET";

const requestParam = z.object({
  deadlineId: zActivityDeadline.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.NotImplemented]: z.object({}),
};

const responseErrorMap = {};

export const apiSem008 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem008RequestParam = z.infer<typeof apiSem008.requestParam>;
type ApiSem008RequestQuery = z.infer<typeof apiSem008.requestQuery>;
type ApiSem008RequestBody = z.infer<typeof apiSem008.requestBody>;
type ApiSem008ResponseNotImplemented = z.infer<
  (typeof apiSem008.responseBodyMap)[501]
>;

export type {
  ApiSem008RequestParam,
  ApiSem008RequestQuery,
  ApiSem008RequestBody,
  ApiSem008ResponseNotImplemented,
};

registry.registerPath({
  tags: ["semester"],
  method: "get",
  path: "/executive/semesters/activity-deadlines/{deadlineId}",
  summary: "SEM-008: 특정 활동보고서 제출 기한 조회하기 (미구현)",
  description:
    "특정 학기의 특정 활동보고서 제출 기한의 상세 정보를 가져옵니다.",
  request: {
    params: apiSem008.requestParam,
  },
  responses: {
    501: {
      description: "아직 구현되지 않은 기능입니다.",
    },
  },
});
