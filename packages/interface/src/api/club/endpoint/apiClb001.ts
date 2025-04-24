import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description 전체 동아리 목록을 가져옵니다
 */

const url = () => `/clubs`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    divisions: z // 분과
      .object({
        id: z.coerce.number().int().min(1),
        name: z.coerce.string().max(20),
        clubs: z // 동아리
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
