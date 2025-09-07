import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubTypeEnum } from "@clubs/domain/club/club-semester";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 내가 활동했던 전체 동아리 목록을 가져옵니다
 */

const url = () => `/student/clubs/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    semesters: z
      .object({
        id: zSemester.shape.id, // 학기 id
        name: zSemester.shape.name, // 학기명
        clubs: z // 활동 동아리 목록
          .object({
            id: zClub.shape.id,
            nameKr: zClub.shape.nameKr,
            nameEn: zClub.shape.nameEn,
            type: z.nativeEnum(ClubTypeEnum), // 동아리 유형(정동아리 | 가동아리)
            isPermanent: z.coerce.boolean(), // 상임동아리 여부
            characteristic: z.coerce.string().max(50), // 동아리 소개
            representative: z.coerce.string().max(20), // 동아리 대표
            advisor: z.coerce.string().max(20).optional(), // 동아리 지도교수
            totalMemberCnt: z.coerce.number().int().min(1),
          })
          .array(),
      })
      .array(),
  }),
};

const responseErrorMap = {};

type ApiClb003RequestParam = z.infer<typeof apiClb003.requestParam>;
type ApiClb003RequestQuery = z.infer<typeof apiClb003.requestQuery>;
type ApiClb003RequestBody = z.infer<typeof apiClb003.requestBody>;
type ApiClb003ResponseOK = z.infer<(typeof apiClb003.responseBodyMap)[200]>;

const apiClb003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb003;

export type {
  ApiClb003RequestParam,
  ApiClb003RequestQuery,
  ApiClb003RequestBody,
  ApiClb003ResponseOK,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/my",
  summary: "CLB-003: 내가 활동했던 전체 동아리 목록을 가져옵니다",
  description: `# CLB-003

내가 활동했던 전체 동아리 목록을 가져옵니다.

학기별로 그룹화된 내가 활동한 동아리 목록을 반환합니다.
  `,
  request: {},
  responses: {
    200: {
      description: "성공적으로 내가 활동했던 동아리 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
