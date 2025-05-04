import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

import apiAct011 from "./apiAct011";

/**
 * @version v0.1
 * @description 교수용 신규등록 활동 리스트
 */

const url = () => `/professor/provisional/activities`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({ clubId: zClub.shape.id });

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: apiAct011.responseBodyMap[HttpStatusCode.Ok],
};

const responseErrorMap = {};

const apiAct013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct013RequestParam = z.infer<typeof apiAct013.requestParam>;
type ApiAct013RequestQuery = z.infer<typeof apiAct013.requestQuery>;
type ApiAct013RequestBody = z.infer<typeof apiAct013.requestBody>;
type ApiAct013ResponseOk = z.infer<(typeof apiAct013.responseBodyMap)[200]>;

export default apiAct013;

export type {
  ApiAct013RequestParam,
  ApiAct013RequestQuery,
  ApiAct013RequestBody,
  ApiAct013ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  summary: "ACT-011: 교수용 신규등록(가동아리) 활동 리스트",
  description: `
  # ACT-013

  교수용 신규등록(가동아리) 활동 리스트

  동아리 지도교수로로 로그인되어 있어야 합니다.

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
