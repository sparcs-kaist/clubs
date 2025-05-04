import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = () => `/student/provisional/activities`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({ clubId: zClub.shape.id });

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activities: z.array(
      z.object({
        id: zActivity.shape.id,
        name: zActivity.shape.name,
        activityTypeEnumId: zActivity.shape.activityTypeEnum,
        activityStatusEnumId: zActivity.shape.activityStatusEnum,
        durations: zActivity.shape.durations,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct011 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct011RequestParam = z.infer<typeof apiAct011.requestParam>;
type ApiAct011RequestQuery = z.infer<typeof apiAct011.requestQuery>;
type ApiAct011RequestBody = z.infer<typeof apiAct011.requestBody>;
type ApiAct011ResponseOk = z.infer<(typeof apiAct011.responseBodyMap)[200]>;

export default apiAct011;

export type {
  ApiAct011RequestParam,
  ApiAct011RequestQuery,
  ApiAct011RequestBody,
  ApiAct011ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  summary: "ACT-011: 학생용 신규등록(가동아리) 활동 리스트",
  description: `
  # ACT-011

  학생용 신규등록(가동아리) 활동 리스트

  동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.

  오늘이 활동보고서 작성기간 | 수정기간 | 예외적 작성기간 이여야 합니다.

  활동기간 사이의 중복을 검사하지 않습니다.

  활동기간이 지난 활동기간 이내여야 합니다.
  `,
  request: {
    query: requestQuery,
  },
  responses: {
    200: {
      description: "성공적으로 활동보고서의 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
  },
});
