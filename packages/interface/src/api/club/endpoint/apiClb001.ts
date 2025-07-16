import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubTypeEnum } from "@clubs/domain/club/club-semester";
import { zDivision } from "@clubs/domain/division/division";

import { registry } from "@clubs/interface/open-api";

const url = () => `/clubs`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    divisions: z // 분과
      .object({
        id: zDivision.shape.id,
        name: zDivision.shape.name,
        clubs: z // 동아리
          .object({
            id: zClub.shape.id,
            nameKr: zClub.shape.nameKr,
            nameEn: zClub.shape.nameEn,
            type: z.nativeEnum(ClubTypeEnum), // 동아리 유형(정동아리 | 가동아리) // TODO: domain 추가하기
            isPermanent: z.coerce.boolean(), // 상임동아리 여부 // TODO: domain 추가하기
            characteristic: zClub.shape.description, // 동아리 소개
            representative: z.coerce.string().max(20), // 동아리 대표 // TODO: domain 추가하기
            advisor: z.coerce.string().max(20).optional(), // 동아리 지도교수 // TODO: domain 추가하기
            totalMemberCnt: z.coerce.number().int().min(1), // TODO: domain 없는게 맞을수도
          })
          .array(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb001RequestParam = z.infer<typeof apiClb001.requestParam>;
type ApiClb001RequestQuery = z.infer<typeof apiClb001.requestQuery>;
type ApiClb001RequestBody = z.infer<typeof apiClb001.requestBody>;
type ApiClb001ResponseOK = z.infer<(typeof apiClb001.responseBodyMap)[200]>;

export default apiClb001;

export type {
  ApiClb001RequestParam,
  ApiClb001RequestQuery,
  ApiClb001RequestBody,
  ApiClb001ResponseOK,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/clubs",
  summary: "CLB-001: 전체 동아리 목록을 가져옵니다",
  description: `# CLB-001

전체 동아리 목록을 가져옵니다.

분과별로 그룹화된 동아리 목록을 반환합니다.
  `,
  request: {},
  responses: {
    200: {
      description: "성공적으로 전체 동아리 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
