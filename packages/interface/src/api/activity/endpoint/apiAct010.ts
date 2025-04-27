import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zStudent } from "@clubs/domain/user/student";

import { zUserName } from "@clubs/interface/common/commonString";
import { registry } from "@clubs/interface/open-api";

const url = () => `/student/activities/available-members`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zClub.shape.id,
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    students: z.array(
      z.object({
        id: zStudent.shape.id,
        // TODO: domain object로 대체하기
        studentNumber: z.coerce.number().int().min(1),
        name: zUserName,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct010 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct010RequestParam = z.infer<typeof apiAct010.requestParam>;
type ApiAct010RequestQuery = z.infer<typeof apiAct010.requestQuery>;
type ApiAct010RequestBody = z.infer<typeof apiAct010.requestBody>;
type ApiAct010ResponseOk = z.infer<(typeof apiAct010.responseBodyMap)[200]>;

export default apiAct010;

export type {
  ApiAct010RequestParam,
  ApiAct010RequestQuery,
  ApiAct010RequestBody,
  ApiAct010ResponseOk,
};

registry.registerPath({
  tags: ["activity"],
  method: "get",
  path: url(),
  summary: `ACT-010: 가동아리 활동 보고서 작성을 위해 동아리 활동 기간에 해당하는 학생 리스트를 조회`,
  description: `
  # ACT-010

  동아리 활동 기간에 해당하는 학생 리스트를 조회합니다.

  동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.

  활동 기간이 지난 활동 기간 이내여야 합니다.

  활동 기간이 없는 학생은 조회되지 않습니다.
  `,
  request: {
    query: requestQuery,
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        "성공적으로 동아리 활동 기간에 해당하는 학생 리스트를 조회했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
