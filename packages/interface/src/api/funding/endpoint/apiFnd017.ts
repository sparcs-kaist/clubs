import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zReviewChangeHistory } from "@clubs/interface/api/review/type/review-change-history.type";
import { registry } from "@clubs/interface/open-api";

export const ApiFnd017RequestUrl =
  "/executive/fundings/funding/:id/change-history";

const apiFnd017 = {
  url: (id: number) => `/executive/fundings/funding/${id}/change-history`,
  method: "GET",
  requestParam: z.object({ id: z.coerce.number().int().positive() }),
  requestQuery: z.object({}),
  requestBody: z.object({}),
  responseBodyMap: { [HttpStatusCode.Ok]: zReviewChangeHistory },
  responseErrorMap: {},
};

export default apiFnd017;
export type ApiFnd017RequestParam = z.infer<typeof apiFnd017.requestParam>;

registry.registerPath({
  tags: ["funding"],
  method: "get",
  path: ApiFnd017RequestUrl.replace(":id", "{id}"),
  summary: "FND-017: 집행부 지원금 신청 변경 이력 조회",
  request: { params: apiFnd017.requestParam },
  responses: {
    200: {
      description: "최신순 수정 전후 지원금 신청 내용",
      content: { "application/json": { schema: zReviewChangeHistory } },
    },
  },
});
