import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubTypeEnum } from "@clubs/domain/club/club-semester";
import { zSemester } from "@clubs/domain/semester/semester";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 지도교수가 지도했던 전체 동아리 목록을 가져옵니다
 */

const url = () => `/professor/clubs/my`;
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

type ApiClb016RequestParam = z.infer<typeof apiClb016.requestParam>;
type ApiClb016RequestQuery = z.infer<typeof apiClb016.requestQuery>;
type ApiClb016RequestBody = z.infer<typeof apiClb016.requestBody>;
type ApiClb016ResponseOk = z.infer<(typeof apiClb016.responseBodyMap)[200]>;

const apiClb016 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb016;

export type {
  ApiClb016RequestParam,
  ApiClb016RequestQuery,
  ApiClb016RequestBody,
  ApiClb016ResponseOk,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/professor/clubs/my",
  summary: "CLB-016: 지도교수가 지도했던 전체 동아리 목록을 가져옵니다",
  description: `# CLB-016

지도교수가 지도했던 전체 동아리 목록을 가져옵니다.

지도교수로 로그인되어 있어야 합니다.

학기별로 그룹화된 지도교수가 지도한 동아리 목록을 반환합니다.
현재 지도 중인 동아리뿐만 아니라 과거에 지도했던 동아리도 포함됩니다.
  `,
  request: {},
  responses: {
    200: {
      description: "성공적으로 지도교수가 지도했던 동아리 목록을 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
