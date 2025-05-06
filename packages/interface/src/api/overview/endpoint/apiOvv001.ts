import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  ClubDelegateEnum,
  zClubDelegate,
} from "@clubs/domain/club/club-delegate";
import { zDivision } from "@clubs/domain/club/division";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description "동아리 대표자대의원" 총람
 */

const url = () => `/overview/delegates`;

const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  division: z.array(zDivision),
  clubNameLike: z.string(),
  clubType: z.object({
    [ClubTypeEnum.Regular]: z.boolean(),
    [ClubTypeEnum.Provisional]: z.boolean(),
  }),
  [ClubDelegateEnum.Delegate1]: z.boolean(),
  [ClubDelegateEnum.Delegate2]: z.boolean(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.array(
    z.object({
      division: z.array(zDivision),
      clubNameLike: z.string(),
      clubType: z.nativeEnum(ClubTypeEnum),
      [ClubDelegateEnum.Representative]: zClubDelegate,
      [ClubDelegateEnum.Delegate1]: zClubDelegate.optional(),
      [ClubDelegateEnum.Delegate2]: zClubDelegate.optional(),
    }),
  ),
};

const responseErrorMap = {};

const apiOvv001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiOvv001RequestParam = z.infer<typeof apiOvv001.requestParam>;
type ApiOvv001RequestQuery = z.infer<typeof apiOvv001.requestQuery>;
type ApiOvv001RequestBody = z.infer<typeof apiOvv001.requestBody>;
type ApiOvv001ResponseOK = z.infer<(typeof apiOvv001.responseBodyMap)[200]>;

export default apiOvv001;

export type {
  ApiOvv001RequestParam,
  ApiOvv001RequestQuery,
  ApiOvv001RequestBody,
  ApiOvv001ResponseOK,
};
