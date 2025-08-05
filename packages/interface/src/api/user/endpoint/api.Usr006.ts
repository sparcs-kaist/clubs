import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutive } from "@clubs/interface/api/user/type/user.type";
import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 새로운 집행부원을 추가합니다.
 */

const url = () => `/executive/user/executives`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  studentNumber: zExecutive.shape.studentNumber,
  name: zExecutive.shape.name,
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiUsr006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr006RequestParam = z.infer<typeof apiUsr006.requestParam>;
type ApiUsr006RequestQuery = z.infer<typeof apiUsr006.requestQuery>;
type ApiUsr006RequestBody = z.infer<typeof apiUsr006.requestBody>;
type ApiUsr006ResponseCreated = z.infer<
  (typeof apiUsr006.responseBodyMap)[201]
>;

export default apiUsr006;

export type {
  ApiUsr006RequestParam,
  ApiUsr006RequestQuery,
  ApiUsr006RequestBody,
  ApiUsr006ResponseCreated,
};

registry.registerPath({
  tags: ["executive"],
  method: "post",
  path: "/executive/user/executives",
  summary: "USR-006: 집행부원 추가",
  description: `
		집행부원을 추가하는 API입니다.
		1. 집행부원은 학번, 이름, 시작날짜, 종료날짜로 식별됩니다.
		2. 이름과 학번이 매칭되지 않는 경우 에러를 반환합니다.
		3. 시작날짜와 종료날짜는 반드시 지정되어야 합니다.
	`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: apiUsr006.requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공적으로 집행부원을 추가했습니다.",
      content: {
        "application/json": {
          schema: apiUsr006.responseBodyMap[HttpStatusCode.Created],
        },
      },
    },
    400: {
      description: "학번과 이름이 매칭되지 않습니다.",
    },
    404: {
      description: "해당 학번의 사용자가 존재하지 않습니다.",
    },
  },
});
