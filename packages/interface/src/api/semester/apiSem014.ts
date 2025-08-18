import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 활동반기를 삭제합니다. (구현 예정)
 */

const url = (activityDurationId: number) =>
  `/executive/semesters/activity-durations/${activityDurationId}`;
const method = "DELETE";

const requestParam = z.object({
  activityDurationId: zActivityDuration.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.NotImplemented]: z.object({}),
};

const responseErrorMap = {};

export const apiSem014 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem014RequestParam = z.infer<typeof apiSem014.requestParam>;
type ApiSem014RequestQuery = z.infer<typeof apiSem014.requestQuery>;
type ApiSem014RequestBody = z.infer<typeof apiSem014.requestBody>;
type ApiSem014ResponseNotImplemented = z.infer<
  (typeof apiSem014.responseBodyMap)[501]
>;

export type {
  ApiSem014RequestParam,
  ApiSem014RequestQuery,
  ApiSem014RequestBody,
  ApiSem014ResponseNotImplemented,
};

registry.registerPath({
  tags: ["semester"],
  method: "delete",
  path: "/executive/semesters/activity-durations/{activityDurationId}",
  summary: "SEM-014: 활동반기 삭제하기 (미구현)",
  description: `
  활동반기를 삭제합니다 (soft delete). 활동반기는 ID로 식별됩니다.
  1. 삭제하려는 활동반기가 존재해야 합니다.
  2. 실제로 데이터를 삭제하지 않고 deletedAt 필드를 설정합니다.
  3. 이미 삭제된 활동반기는 다시 삭제할 수 없습니다.
  4. 활동반기에 연결된 활동보고서 기한이 있는 경우 삭제할 수 없습니다.
  `,
  request: {
    params: apiSem014.requestParam,
  },
  responses: {
    501: {
      description: "아직 구현되지 않은 기능입니다.",
    },
  },
});
