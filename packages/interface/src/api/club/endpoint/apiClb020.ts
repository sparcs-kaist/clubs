import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubTypeEnum } from "@clubs/domain/club/club-semester";
import { zSemester } from "@clubs/domain/semester/semester";
import { zStudent } from "@clubs/domain/user/student";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import { registry } from "@clubs/interface/open-api";

const url = (clubId: number) =>
  `/executive/clubs/club/${clubId}/registration-delegate-change`;
const method = "GET";
const requestParam = z.object({ clubId: zClub.shape.id });
const requestQuery = z.object({});
const requestBody = z.object({});
const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    isChangeable: z.boolean(),
    registrationSemester: zSemester.pick({ id: true, year: true, name: true }),
    previousSemester: zSemester.pick({ id: true, year: true, name: true }),
    effectiveAt: z.coerce.date(),
    club: z.object({
      id: zClub.shape.id,
      nameKr: zClub.shape.nameKr,
      nameEn: zClub.shape.nameEn,
      type: z.nativeEnum(ClubTypeEnum),
      divisionName: z.string(),
    }),
    delegates: z.array(
      z.object({
        clubDelegateEnumId: z.nativeEnum(ClubDelegateEnum),
        studentId: zStudent.shape.id,
        studentNumber: zStudent.shape.studentNumber,
        name: zStudent.shape.name,
      }),
    ),
    members: z.array(
      z.object({
        studentId: zStudent.shape.id,
        studentNumber: zStudent.shape.studentNumber,
        name: zStudent.shape.name,
        isRegularMember: z.boolean(),
        hasUserAccount: z.boolean(),
        isAssignable: z.boolean(),
      }),
    ),
  }),
};
const responseErrorMap = {};

const apiClb020 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb020RequestParam = z.infer<typeof requestParam>;
type ApiClb020ResponseOk = z.infer<(typeof responseBodyMap)[200]>;

export default apiClb020;
export type { ApiClb020RequestParam, ApiClb020ResponseOk };

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/executive/clubs/club/{clubId}/registration-delegate-change",
  summary: "CLB-020: 등록기간 중 대표자 변경 상세 정보를 조회합니다",
  request: { params: requestParam },
  responses: {
    200: {
      description: "전 학기 대표자·대의원과 활동회원 목록입니다.",
      content: { "application/json": { schema: responseBodyMap[200] } },
    },
  },
});
