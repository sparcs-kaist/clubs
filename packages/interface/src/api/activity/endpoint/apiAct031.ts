import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zReviewChangeHistory } from "@clubs/interface/api/review/type/review-change-history.type";
import { registry } from "@clubs/interface/open-api";

export const ApiAct031RequestUrl =
  "/executive/activities/activity/:activityId/change-history";

const apiAct031 = {
  url: (activityId: number) =>
    `/executive/activities/activity/${activityId}/change-history`,
  method: "GET",
  requestParam: z.object({ activityId: z.coerce.number().int().positive() }),
  requestQuery: z.object({}),
  requestBody: z.object({}),
  responseBodyMap: { [HttpStatusCode.Ok]: zReviewChangeHistory },
  responseErrorMap: {},
};

export default apiAct031;
export type ApiAct031RequestParam = z.infer<typeof apiAct031.requestParam>;

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: ApiAct031RequestUrl.replace(":activityId", "{activityId}"),
  summary: "ACT-031: 집행부 활동보고서 변경 이력 조회",
  request: { params: apiAct031.requestParam },
  responses: {
    200: {
      description: "최신순 수정 전후 활동보고서 내용",
      content: { "application/json": { schema: zReviewChangeHistory } },
    },
  },
});
