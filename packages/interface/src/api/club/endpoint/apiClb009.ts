import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리가 활동한 모든 학기를 가져옵니다.
 */

const url = (clubId: number) =>
  `/student/clubs/club/${clubId}/members/semesters`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    semesters: z
      .object({
        id: zSemester.shape.id,
        year: zSemester.shape.year,
        name: zSemester.shape.name,
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb009RequestParam = z.infer<typeof apiClb009.requestParam>;
type ApiClb009RequestQuery = z.infer<typeof apiClb009.requestQuery>;
type ApiClb009RequestBody = z.infer<typeof apiClb009.requestBody>;
type ApiClb009ResponseOk = z.infer<(typeof apiClb009.responseBodyMap)[200]>;

export default apiClb009;

export type {
  ApiClb009RequestParam,
  ApiClb009RequestQuery,
  ApiClb009RequestBody,
  ApiClb009ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/club/:clubId/members/semesters",
  summary: "CLB-009: 동아리가 활동한 모든 학기를 가져옵니다",
  description: `# CLB-009

동아리가 활동한 모든 학기를 가져옵니다.

동아리 대표자로 로그인되어 있어야 합니다.

해당 동아리가 활동한 모든 학기의 목록을 반환합니다.
학기별 회원 조회 시 사용할 수 있습니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 동아리가 활동한 학기 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
