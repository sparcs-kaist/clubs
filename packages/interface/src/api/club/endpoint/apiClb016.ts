import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

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
        id: z.coerce.number().int().min(1), // 학기 id
        name: z.coerce.string().max(20), // 학기명
        clubs: z // 활동 동아리 목록
          .object({
            id: z.coerce.number().int().min(1),
            nameKr: zClubName,
            nameEn: zClubName,
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
