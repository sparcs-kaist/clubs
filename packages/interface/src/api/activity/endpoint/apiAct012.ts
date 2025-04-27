import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

import apiAct011 from "./apiAct011";

/**
 * @version v0.1
 * @description 집행부용 신규등록 활동 리스트
 */

const url = () => `/executive/provisional/activities`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({ clubId: zClub.shape.id });

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: apiAct011.responseBodyMap[HttpStatusCode.Ok],
};

const responseErrorMap = {};

const apiAct012 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct012RequestParam = z.infer<typeof apiAct012.requestParam>;
type ApiAct012RequestQuery = z.infer<typeof apiAct012.requestQuery>;
type ApiAct012RequestBody = z.infer<typeof apiAct012.requestBody>;
type ApiAct012ResponseOk = z.infer<(typeof apiAct012.responseBodyMap)[200]>;

export default apiAct012;

export type {
  ApiAct012RequestParam,
  ApiAct012RequestQuery,
  ApiAct012RequestBody,
  ApiAct012ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  summary: "ACT-012: 집행부용 신규등록(가동아리) 활동 리스트",
  description: `
  # ACT-011

  집행부용 신규등록(가동아리) 활동 리스트

  집행부원으로 로그인되어 있어야 합니다.

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
