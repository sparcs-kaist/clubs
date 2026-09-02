import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegate } from "@clubs/domain/club/club-delegate";
import { zStudent } from "@clubs/domain/user/student";

import { registry } from "@clubs/interface/open-api";

const url = (clubId: number) =>
  `/executive/clubs/club/${clubId}/registration-delegate-change`;
const method = "PATCH";
const requestParam = z.object({ clubId: zClub.shape.id });
const requestQuery = z.object({});
const requestBody = z.object({
  studentId: zStudent.shape.id,
  clubDelegateEnumId: zClubDelegate.shape.clubDelegateEnum,
});
const responseBodyMap = { [HttpStatusCode.Ok]: z.object({}) };
const responseErrorMap = {};

const apiClb021 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb021RequestParam = z.infer<typeof requestParam>;
type ApiClb021RequestBody = z.infer<typeof requestBody>;
type ApiClb021ResponseOk = z.infer<(typeof responseBodyMap)[200]>;

export default apiClb021;
export type {
  ApiClb021RequestParam,
  ApiClb021RequestBody,
  ApiClb021ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "patch",
  path: "/executive/clubs/club/{clubId}/registration-delegate-change",
  summary: "CLB-021: 등록기간 중 대표자 또는 대의원을 변경합니다",
  description:
    "동아리 등록 기간에만 가능하며 변경 시각은 서버가 전 학기 종료 전날로 기록합니다.",
  request: {
    params: requestParam,
    body: { content: { "application/json": { schema: requestBody } } },
  },
  responses: {
    200: {
      description: "대표자 또는 대의원을 변경했습니다.",
      content: { "application/json": { schema: responseBodyMap[200] } },
    },
  },
});
