import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zDivision } from "@clubs/domain/club/division";
import { zStudent } from "@clubs/domain/user/student";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description "동아리 대표자대의원" 총람
 */

const url = () => `/overview/delegates`;

const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  division: z.array(zDivision.shape.id),
  clubNameLike: z.string(),
  year: z.coerce.number(),
  semesterName: z.string(),
  clubType: z.object({
    regular: z.boolean(),
    provisional: z.boolean(),
  }),
  delegate1: z.boolean(),
  delegate2: z.boolean(),
});

const requestBody = z.object({});

const zDelegateForOverview = z.object({
  clubId: zClub.shape.id,
  delegateType: z.nativeEnum(ClubDelegateEnum),
  name: zStudent.shape.name,
  studentNumber: z.coerce.number(),
  phoneNumber: zStudent.shape.phoneNumber,
  kaistEmail: zStudent.shape.email,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.array(
    z.object({
      division: zDivision.shape.name,
      clubNameKr: zClub.shape.nameKr,
      clubNameEn: zClub.shape.nameEn,
      representative: zDelegateForOverview.optional(),
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
