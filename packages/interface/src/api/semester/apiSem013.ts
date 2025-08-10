import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 활동반기를 수정합니다. (구현 예정)
 */

const url = (activityDurationId: number) =>
  `/executive/semesters/activity-durations/${activityDurationId}`;
const method = "PUT";

const requestParam = z.object({
  activityDurationId: zActivityDuration.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  semesterId: zActivityDuration.shape.semester.shape.id.optional(),
  activityDurationTypeEnum:
    zActivityDuration.shape.activityDurationTypeEnum.optional(),
  year: zActivityDuration.shape.year.optional(),
  name: zActivityDuration.shape.name.optional(),
  startTerm: zActivityDuration.shape.startTerm.optional(),
  endTerm: zActivityDuration.shape.endTerm.optional(),
});

const responseBodyMap = {
  [HttpStatusCode.NotImplemented]: z.object({}),
};

const responseErrorMap = {};

export const apiSem013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem013RequestParam = z.infer<typeof apiSem013.requestParam>;
type ApiSem013RequestQuery = z.infer<typeof apiSem013.requestQuery>;
type ApiSem013RequestBody = z.infer<typeof apiSem013.requestBody>;
type ApiSem013ResponseNotImplemented = z.infer<
  (typeof apiSem013.responseBodyMap)[501]
>;

export type {
  ApiSem013RequestParam,
  ApiSem013RequestQuery,
  ApiSem013RequestBody,
  ApiSem013ResponseNotImplemented,
};

registry.registerPath({
  tags: ["semester"],
  method: "put",
  path: "/executive/semesters/activity-durations/{activityDurationId}",
  summary: "SEM-013: 활동반기 수정하기 (미구현)",
  description: `
  활동반기를 수정합니다. 활동반기는 학기, 활동반기 분류, 년도, 이름, 시작/종료일로 구성되어 있습니다.
  1. (활동반기명, 년도) 쌍은 유일해야 합니다.
  2. 모든 활동반기는 시작일이 종료일보다 이전이어야 합니다.
  3. 시작일은 포함하고 종료일은 포함하지 않습니다.
  4. 모든 기간은 겹치면 안 됩니다.
  5. 활동반기 분류는 1(정규) 또는 2(신규등록)여야 합니다.
  `,
  request: {
    params: apiSem013.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiSem013.requestBody,
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
