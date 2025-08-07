import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutive } from "@clubs/interface/api/user/type/user.type";
import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 집행부원을 조회합니다.
 */

const url = () => `/executive/user/executives`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    executives: z.array(
      z.object({
        id: zExecutive.shape.id,
        userId: zExecutive.shape.userId,
        studentNumber: zExecutive.shape.studentNumber,
        name: zExecutive.shape.name,
        email: zExecutive.shape.email,
        phoneNumber: zExecutive.shape.phoneNumber,
        startTerm: z.coerce.date(),
        endTerm: z.coerce.date(),
      }),
    ),
  }),
};

const responseErrorMap = {};

export const apiUsr007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr007RequestParam = z.infer<typeof apiUsr007.requestParam>;
type ApiUsr007RequestQuery = z.infer<typeof apiUsr007.requestQuery>;
type ApiUsr007RequestBody = z.infer<typeof apiUsr007.requestBody>;
type ApiUsr007ResponseOk = z.infer<(typeof apiUsr007.responseBodyMap)[200]>;

export type {
  ApiUsr007RequestParam,
  ApiUsr007RequestQuery,
  ApiUsr007RequestBody,
  ApiUsr007ResponseOk,
};

registry.registerPath({
  tags: ["executive"],
  method: "get",
  path: "/executive/user/executives",
  summary: "USR-007: 집행부원 조회",
  description: `
		집행부원 목록을 조회하는 API입니다.
		1. 현재 날짜 기준으로 유효한 모든 집행부원의 정보를 반환합니다.
		2. id, userId, 학번, 이름, 이메일, 전화번호, 시작날짜, 종료날짜가 포함됩니다.
    3. userId가 없는 집행부원의 경우 조회되지 않습니다.
	`,
  request: {},
  responses: {
    200: {
      description: "성공적으로 집행부원 목록을 조회했습니다.",
      content: {
        "application/json": {
          schema: apiUsr007.responseBodyMap[HttpStatusCode.Ok],
        },
      },
    },
    403: {
      description: "권한이 없습니다.",
    },
    400: {
      description: "잘못된 요청입니다.",
    },
  },
});
