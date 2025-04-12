import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 동아리의 대표자 및 대의원 변경을 위한 목록을 가져옵니다.
 */

const url = (clubId: number, delegateEnumId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate/${delegateEnumId}/candidates`;
const method = "GET";

const requestParam = z.object({
  clubId: z.coerce.number().int(),
  delegateEnumId: z.preprocess(
    val => z.coerce.number().int().parse(val),
    z.nativeEnum(ClubDelegateEnum),
  ),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    students: z.array(
      z.object({
        id: z.coerce.number().int(),
        studentNumber: z.string(),
        name: z.coerce.string().max(20), // studentNumber는 string으로 통일!
        phoneNumber: zKrPhoneNumber,
      }),
    ),
  }),
};

const responseErrorMap = {};

type ApiClb008RequestParam = z.infer<typeof apiClb008.requestParam>;
type ApiClb008RequestQuery = z.infer<typeof apiClb008.requestQuery>;
type ApiClb008RequestBody = z.infer<typeof apiClb008.requestBody>;
type ApiClb008ResponseOk = z.infer<(typeof apiClb008.responseBodyMap)[200]>;

const apiClb008 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb008;

export type {
  ApiClb008RequestParam,
  ApiClb008RequestQuery,
  ApiClb008RequestBody,
  ApiClb008ResponseOk,
};
