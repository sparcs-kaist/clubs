import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zDistrict, zDivision } from "@clubs/domain/club/division";
import { zStudent } from "@clubs/domain/user/student";

import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description "동아리 대표자대의원" 총람
 */

const url = () => `/overview/delegates`;

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
  // 대의원1/2가 있는 동아리만 찾고싶을 때 사용
  // false여도 대의원1이 있는 동아리까지 찾아줘야 함
  hasDelegate1: zStringBoolean,
  hasDelegate2: zStringBoolean,
});

const requestBody = z.object({});

const zDelegateForOverview = z.object({
  clubId: zClub.shape.id,
  delegateType: z.nativeEnum(ClubDelegateEnum),
  name: zStudent.shape.name,
  studentNumber: z.coerce.number(),
  phoneNumber: zStudent.shape.phoneNumber.nullable(),
  kaistEmail: zStudent.shape.email.nullable(),
  department: z.string(),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.array(
    z.object({
      clubId: zClub.shape.id,
      divisionName: zDivision.shape.name,
      district: zDistrict.shape.name,
      clubTypeEnum: z.nativeEnum(ClubTypeEnum),
      clubNameKr: zClub.shape.nameKr,
      clubNameEn: zClub.shape.nameEn,
      representative: zDelegateForOverview,
      delegate1: zDelegateForOverview.optional(),
      delegate2: zDelegateForOverview.optional(),
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
