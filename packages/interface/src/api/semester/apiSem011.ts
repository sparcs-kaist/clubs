import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 활동반기를 추가합니다. (구현 예정)
 */

const url = () => `/executive/semesters/activity-durations`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  semesterId: zActivityDuration.shape.semester.shape.id,
  activityDurationTypeEnum: zActivityDuration.shape.activityDurationTypeEnum,
  year: zActivityDuration.shape.year,
  name: zActivityDuration.shape.name,
  startTerm: zActivityDuration.shape.startTerm,
  endTerm: zActivityDuration.shape.endTerm,
});

const responseBodyMap = {
  [HttpStatusCode.NotImplemented]: z.object({}),
};

const responseErrorMap = {};

export const apiSem011 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem011RequestParam = z.infer<typeof apiSem011.requestParam>;
type ApiSem011RequestQuery = z.infer<typeof apiSem011.requestQuery>;
type ApiSem011RequestBody = z.infer<typeof apiSem011.requestBody>;
type ApiSem011ResponseNotImplemented = z.infer<
  (typeof apiSem011.responseBodyMap)[501]
>;

export type {
  ApiSem011RequestParam,
  ApiSem011RequestQuery,
  ApiSem011RequestBody,
  ApiSem011ResponseNotImplemented,
};

registry.registerPath({
  tags: ["semester"],
  method: "post",
  path: "/executive/semesters/activity-durations",
  summary: "SEM-011: 활동반기 추가하기 (미구현)",
  description: `
  활동반기를 추가합니다. 활동반기는 학기, 활동반기 분류, 년도, 이름, 시작/종료일로 구성되어 있습니다.
  1. (활동반기명, 년도) 쌍은 유일해야 합니다.
  2. 모든 활동반기는 시작일이 종료일보다 이전이어야 합니다.
  3. 시작일은 포함하고 종료일은 포함하지 않습니다.
  4. 모든 기간은 겹치면 안 됩니다.
  5. 활동반기 분류는 1(정규) 또는 2(신규등록)여야 합니다.
  `,
  request: {
    query: apiSem011.requestQuery,
    body: {
      content: {
        "application/json": {
          schema: apiSem011.requestBody,
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
