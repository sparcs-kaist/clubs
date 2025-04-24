import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description 내가 대표자 또는 대의원으로 있는 동아리의 clubId를 가져옵니다. 대표자 또는 대의원이 아닐 경우 204 No Content를 반환합니다.
 */

const url = () => `/student/clubs/delegates/delegate/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubId: z.coerce.number().int().min(1),
    delegateEnumId: z.nativeEnum(ClubDelegateEnum),
  }),
  [HttpStatusCode.NoContent]: z.object({}),
};

const responseErrorMap = {};

const apiClb015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb015RequestParam = z.infer<typeof apiClb015.requestParam>;
type ApiClb015RequestQuery = z.infer<typeof apiClb015.requestQuery>;
type ApiClb015RequestBody = z.infer<typeof apiClb015.requestBody>;
type ApiClb015ResponseOk = z.infer<(typeof apiClb015.responseBodyMap)[200]>;
type ApiClb015ResponseNoContent = z.infer<
  (typeof apiClb015.responseBodyMap)[204]
>;

export default apiClb015;

export type {
  ApiClb015RequestParam,
  ApiClb015RequestQuery,
  ApiClb015RequestBody,
  ApiClb015ResponseOk,
  ApiClb015ResponseNoContent,
};
