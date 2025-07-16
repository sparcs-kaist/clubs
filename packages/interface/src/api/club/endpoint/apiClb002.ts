import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { zDivision } from "@clubs/interface/api/division/type/division.type";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 상세정보를 가져옵니다
 */

const url = (clubId: string) => `/clubs/club/${clubId}`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: zClub.shape.id,
    nameKr: zClub.shape.nameKr,
    nameEn: zClub.shape.nameEn,
    type: z.nativeEnum(ClubTypeEnum), // 동아리 유형(정동아리 | 가동아리)
    isPermanent: z.coerce.boolean(), // 상임동아리 여부
    characteristic: z.coerce.string().max(50), // 동아리 소개
    representative: z.coerce.string().max(20), // 동아리 대표
    advisor: z.coerce.string().max(20).optional(), // 동아리 지도교수
    totalMemberCnt: z.coerce.number().int().min(1),
    description: zClub.shape.description,
    division: z.object({
      id: zDivision.shape.id,
      name: zDivision.shape.name,
    }), // 분과명
    foundingYear: zClub.shape.foundingYear,
    room: z.coerce.string().max(50), // 동아리방 위치
  }),
};

const responseErrorMap = {};

type ApiClb002RequestParam = z.infer<typeof apiClb002.requestParam>;
type ApiClb002RequestQuery = z.infer<typeof apiClb002.requestQuery>;
type ApiClb002RequestBody = z.infer<typeof apiClb002.requestBody>;
type ApiClb002ResponseOK = z.infer<(typeof apiClb002.responseBodyMap)[200]>;

const apiClb002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb002;

export type {
  ApiClb002RequestBody,
  ApiClb002RequestParam,
  ApiClb002RequestQuery,
  ApiClb002ResponseOK,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/clubs/club/:clubId",
  summary: "CLB-002: 동아리의 상세정보를 가져옵니다",
  description: `
# CLB-002

동아리의 상세정보를 가져옵니다.

동아리 ID를 통해 해당 동아리의 상세 정보를 조회합니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 동아리 상세정보를 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
