import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description 동아리의 현재 신청된 대표자 변경을 조회합니다.
 */

const url = (clubId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate/requests`;
const method = "GET";

const requestParam = z.object({
  clubId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    requests: z
      .object({
        studentId: z.coerce.number().int().min(1),
        studentNumber: z.coerce.number().int().min(20000000).max(30000000),
        studentName: z.coerce.string(),
        clubDelegateChangeRequestStatusEnumId: z.nativeEnum(
          ClubDelegateChangeRequestStatusEnum,
        ),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb011 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb011RequestParam = z.infer<typeof apiClb011.requestParam>;
type ApiClb011RequestQuery = z.infer<typeof apiClb011.requestQuery>;
type ApiClb011RequestBody = z.infer<typeof apiClb011.requestBody>;
type ApiClb011ResponseOk = z.infer<(typeof apiClb011.responseBodyMap)[200]>;

export default apiClb011;

export type {
  ApiClb011RequestParam,
  ApiClb011RequestQuery,
  ApiClb011RequestBody,
  ApiClb011ResponseOk,
};
