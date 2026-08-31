import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

const url = () => "/clubs/semesters/counts";
const method = "GET";

const requestParam = z.object({});
const requestQuery = z.object({});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    counts: z.array(
      z.object({
        semesterId: zSemester.shape.id,
        clubCount: z.coerce.number().int().min(0),
      }),
    ),
  }),
};

const responseErrorMap = {};

type ApiClb018ResponseOk = z.infer<(typeof responseBodyMap)[200]>;

const apiClb018 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb018;
export type { ApiClb018ResponseOk };

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/clubs/semesters/counts",
  summary: "CLB-018: 학기별 동아리 수를 가져옵니다",
  description: `# CLB-018

학기별 정동아리·가동아리 수를 반환합니다.
  `,
  request: {},
  responses: {
    200: {
      description: "학기별 동아리 수를 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
