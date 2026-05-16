import { HttpStatusCode } from "axios";
import { z } from "zod";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 집행부원 임기 시작/종료일을 수정합니다.
 */

const url = (executiveTId: number) =>
  `/executive/user/executives/${executiveTId}`;
const method = "PUT";

const requestParam = z.object({
  executiveTId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date().nullable(),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

export const apiUsr009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr009RequestParam = z.infer<typeof apiUsr009.requestParam>;
type ApiUsr009RequestQuery = z.infer<typeof apiUsr009.requestQuery>;
type ApiUsr009RequestBody = z.infer<typeof apiUsr009.requestBody>;
type ApiUsr009ResponseOk = z.infer<(typeof apiUsr009.responseBodyMap)[200]>;

export type {
  ApiUsr009RequestParam,
  ApiUsr009RequestQuery,
  ApiUsr009RequestBody,
  ApiUsr009ResponseOk,
};

registry.registerPath({
  tags: ["executive"],
  method: "put",
  path: "/executive/user/executives/:executiveTId",
  summary: "USR-009: 집행부원 임기 수정하기",
  description: `
    집행부원 임기의 시작/종료일을 수정합니다.
    1. 수정하려는 집행부원 임기가 존재해야 합니다.
    2. 종료날짜는 비워둘 수 있습니다.
    3. 종료날짜가 있는 경우 시작날짜는 종료날짜보다 이전이어야 합니다.
    4. 같은 학생의 다른 집행부원 임기와 겹치면 에러를 반환합니다.
  `,
  request: {
    params: apiUsr009.requestParam,
    body: {
      content: {
        "application/json": {
          schema: apiUsr009.requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공적으로 집행부원 임기를 수정했습니다.",
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    403: {
      description: "권한이 없습니다.",
    },
    404: {
      description: "존재하지 않는 집행부원 임기입니다.",
    },
  },
});
