import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubBuildingEnum } from "@clubs/domain/club/club-semester";
import { zDistrict, zDivision } from "@clubs/domain/club/division";
import { zProfessor } from "@clubs/domain/user/professor";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description "동아리 정보(KR)" 총람
 */

const url = () => `/overview/clubinfo/kr`;

const method = "GET";

const requestParam = z.object({});

const zStringBoolean = z
  .string()
  .toLowerCase()
  .transform(x => x === "true")
  .pipe(z.boolean());

const requestQuery = z.object({
  division: z.coerce.string(),
  year: z.coerce.number(),
  semesterName: z.string(),
  provisional: zStringBoolean,
  regular: zStringBoolean,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.array(
    z.object({
      clubId: zClub.shape.id,
      divisionName: zDivision.shape.name,
      district: zDistrict.shape.name,
      clubTypeEnum: z.nativeEnum(ClubTypeEnum),
      clubNameKr: zClub.shape.nameKr,
      clubNameEn: zClub.shape.nameEn,
      fieldsOfActivity: z.string(),
      foundingYear: zClub.shape.foundingYear,
      professor: zProfessor.shape.name,
      totalMemberCnt: z.coerce.number().int().min(1),
      regularMemberCnt: z.coerce.number().int().nonnegative(),
      clubBuildingEnum: z.nativeEnum(ClubBuildingEnum),
      roomLocation: z.string().optional(),
      roomPassword: z.string().optional(),
      warning: z.string().optional(),
      caution: z.string().optional(),
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
