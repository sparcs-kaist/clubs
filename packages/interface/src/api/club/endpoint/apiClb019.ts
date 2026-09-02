import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubTypeEnum } from "@clubs/domain/club/club-semester";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

const url = () => "/executive/clubs/registration-delegate-changes";
const method = "GET";
const requestParam = z.object({});
const requestQuery = z.object({});
const requestBody = z.object({});
const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    isChangeable: z.boolean(),
    registrationSemester: zSemester.pick({ id: true, year: true, name: true }),
    previousSemester: zSemester.pick({ id: true, year: true, name: true }),
    effectiveAt: z.coerce.date(),
    clubs: z.array(
      z.object({
        id: zClub.shape.id,
        nameKr: zClub.shape.nameKr,
        nameEn: zClub.shape.nameEn,
        type: z.nativeEnum(ClubTypeEnum),
        divisionName: z.string(),
        representative: z.string(),
      }),
    ),
  }),
};
const responseErrorMap = {};

const apiClb019 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb019ResponseOk = z.infer<(typeof responseBodyMap)[200]>;

export default apiClb019;
export type { ApiClb019ResponseOk };

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: url(),
  summary: "CLB-019: 등록기간 중 대표자 변경 대상 동아리를 조회합니다",
  request: {},
  responses: {
    200: {
      description: "등록 서류를 제출하지 않은 전 학기 활동 동아리 목록입니다.",
      content: { "application/json": { schema: responseBodyMap[200] } },
    },
  },
});
