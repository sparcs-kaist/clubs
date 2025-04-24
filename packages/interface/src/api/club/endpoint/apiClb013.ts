import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

/**
 * @version v0.1
 * @description 마이페이지에서 나에게 신청한 대표자 변경을 조회합니다.
 */

const url = () => `/student/clubs/delegates/requests`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    requests: z
      .object({
        id: z.number().int().min(1),
        prevStudentId: z.coerce.number().int().min(1),
        prevStudentNumber: z.coerce.number().int().min(20000000).max(30000000),
        prevStudentName: z.coerce.string(),
        clubId: z.coerce.number().int().min(1),
        clubName: z.coerce.string(),
        clubDelegateChangeRequestStatusEnumId: z.nativeEnum(
          ClubDelegateChangeRequestStatusEnum,
        ),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiClb013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb013RequestParam = z.infer<typeof apiClb013.requestParam>;
type ApiClb013RequestQuery = z.infer<typeof apiClb013.requestQuery>;
type ApiClb013RequestBody = z.infer<typeof apiClb013.requestBody>;
type ApiClb013ResponseOk = z.infer<(typeof apiClb013.responseBodyMap)[200]>;

export default apiClb013;

export type {
  ApiClb013RequestParam,
  ApiClb013RequestQuery,
  ApiClb013RequestBody,
  ApiClb013ResponseOk,
};
