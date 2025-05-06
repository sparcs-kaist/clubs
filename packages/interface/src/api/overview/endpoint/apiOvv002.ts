import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubTypeEnum, zClubRoom } from "@clubs/domain/club/club-semester";
import { zDivision } from "@clubs/domain/club/division";
import { zProfessor } from "@clubs/domain/user/professor";

import { zClubName } from "@clubs/interface/common/commonString";

/**
 * @version v0.1
 * @description "동아리 정보(KR)" 총람
 */

const url = () => `/overview/clubinfokr`;

const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  division: z.array(zDivision),
  clubNameLike: z.string(),
  clubType: z.object({
    [ClubTypeEnum.Regular]: z.boolean(),
    [ClubTypeEnum.Provisional]: z.boolean(),
  }),

  /*
  
  <동아리정보>
  분과구
  분과
  동아리 대표명칭

  [동아리 정보(KR)]
  <동아리정보>
  활동분야
  설립년도
  지도교수
  회원수
  정회원수
  동아리방 위치
  동아리방 비번
  경고
  주의

  */
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.array(
    z.object({
      clubName: zClubName,
      fieldsOfActivity: zClub.shape.description,
      foundingYear: zClub.shape.foundingYear,
      professor: zProfessor,
      members: z.coerce.number().int().min(1),
      regularMembers: z.coerce.number().int().nonnegative(),
      room: zClubRoom,
      warning: z.string(),
      caution: z.string(),
    }),
  ),
};

const responseErrorMap = {};

const apiOvv002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiOvv002RequestParam = z.infer<typeof apiOvv002.requestParam>;
type ApiOvv002RequestQuery = z.infer<typeof apiOvv002.requestQuery>;
type ApiOvv002RequestBody = z.infer<typeof apiOvv002.requestBody>;
type ApiOvv002ResponseOK = z.infer<(typeof apiOvv002.responseBodyMap)[200]>;

export default apiOvv002;

export type {
  ApiOvv002RequestParam,
  ApiOvv002RequestQuery,
  ApiOvv002RequestBody,
  ApiOvv002ResponseOK,
};
