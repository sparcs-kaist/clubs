import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zUserName } from "@clubs/interface/common/commonString";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 동아리의 대표자 및 대의원 정보를 가져옵니다
 */

const url = (clubId: number) => `/student/clubs/club/${clubId}/delegates`;
const method = "GET";

const requestParam = z.object({
  clubId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    delegates: z.array(
      z.object({
        delegateEnumId: z.nativeEnum(ClubDelegateEnum),
        studentId: z.coerce.number().int().min(1),
        studentNumber: z.coerce.number().int().min(1),
        name: zUserName,
        phoneNumber: zKrPhoneNumber,
      }),
    ),
  }),
};

const responseErrorMap = {};

type ApiClb006RequestParam = z.infer<typeof apiClb006.requestParam>;
type ApiClb006RequestQuery = z.infer<typeof apiClb006.requestQuery>;
type ApiClb006RequestBody = z.infer<typeof apiClb006.requestBody>;
type ApiClb006ResponseOK = z.infer<(typeof apiClb006.responseBodyMap)[200]>;

const apiClb006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb006;

export type {
  ApiClb006RequestParam,
  ApiClb006RequestQuery,
  ApiClb006RequestBody,
  ApiClb006ResponseOK,
};
