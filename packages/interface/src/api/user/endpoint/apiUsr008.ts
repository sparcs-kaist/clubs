import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutive } from "@clubs/domain/user/executive";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 집행부원을 삭제합니다.
 */

const url = () => `/executive/user/executives/:executiveId`;
const method = "DELETE";

const requestParam = z.object({
  executiveId: zExecutive.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

export const apiUsr008 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr008RequestParam = z.infer<typeof apiUsr008.requestParam>;
type ApiUsr008RequestQuery = z.infer<typeof apiUsr008.requestQuery>;
type ApiUsr008RequestBody = z.infer<typeof apiUsr008.requestBody>;
type ApiUsr008ResponseOk = z.infer<(typeof apiUsr008.responseBodyMap)[200]>;

export type {
  ApiUsr008RequestParam,
  ApiUsr008RequestQuery,
  ApiUsr008RequestBody,
  ApiUsr008ResponseOk,
};

registry.registerPath({
  tags: ["executive"],
  method: "delete",
  path: "/executive/user/executives/:executiveId",
  summary: "USR-008: 집행부원 삭제하기",
  description: `
	집행부원을 삭제합니다.
	1. 삭제하려는 집행부원이 존재해야 합니다.
	2. 실제로 데이터를 삭제하지 않고 deletedAt 필드를 설정합니다.
	3. 삭제하려는 집행부원의 id를 URL 파라미터로 전달해야 합니다.
	`,
  request: {
    params: apiUsr008.requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 집행부원을 삭제했습니다.",
    },
    400: {
      description: "잘못된 요청입니다.",
    },
    403: {
      description: "권한이 없습니다.",
    },
    404: {
      description: "존재하지 않는 집행부원입니다.",
    },
  },
});
