import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zStudent } from "@clubs/domain/user/student";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import { registry } from "@clubs/interface/open-api";

const url = (clubId: number) =>
  `/executive/clubs/club/${clubId}/registration-delegate-cancellation`;
const method = "PATCH";
const requestParam = z.object({ clubId: zClub.shape.id });
const requestQuery = z.object({});
const requestBody = z.object({
  studentId: zStudent.shape.id,
  clubDelegateEnumId: z.union([
    z.literal(ClubDelegateEnum.Delegate1),
    z.literal(ClubDelegateEnum.Delegate2),
  ]),
});
const responseBodyMap = { [HttpStatusCode.Ok]: z.object({}) };
const responseErrorMap = {};

const apiClb022 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb022RequestParam = z.infer<typeof requestParam>;
type ApiClb022RequestBody = z.infer<typeof requestBody>;
type ApiClb022ResponseOk = z.infer<(typeof responseBodyMap)[200]>;

export default apiClb022;
export type {
  ApiClb022RequestParam,
  ApiClb022RequestBody,
  ApiClb022ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "patch",
  path: "/executive/clubs/club/{clubId}/registration-delegate-cancellation",
  summary: "CLB-022: 등록기간 중 과거 대의원 임기를 종료합니다",
  description:
    "이번 학기 등록 서류 제출 여부와 관계없이 동아리 등록 기간에 가능합니다. 전 학기 종료 전날에 대의원 임기를 종료합니다.",
  request: {
    params: requestParam,
    body: { content: { "application/json": { schema: requestBody } } },
  },
  responses: {
    200: {
      description: "대의원 임기를 종료했습니다.",
      content: { "application/json": { schema: responseBodyMap[200] } },
    },
  },
});
